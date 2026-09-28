import { computeStreak, pointsForWin } from './storage';
import { getSupabaseAdmin } from './supabaseServer';
import type { PuzzleDate } from './types';

export const ANON_USERNAME = 'Cinefilo anonimo';
const ANON_EMAIL = 'cinefilo-anonimo@cineclue.app';

export interface DatedWin {
  date: PuzzleDate;
  attempts: number;
}

type Admin = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

function isWin(value: unknown): value is DatedWin {
  if (!value || typeof value !== 'object') return false;
  const row = value as { date?: unknown; attempts?: unknown };
  return (
    typeof row.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(row.date) &&
    Number.isInteger(row.attempts) &&
    Number(row.attempts) >= 1 &&
    Number(row.attempts) <= 6
  );
}

export function parseWins(value: unknown): DatedWin[] {
  if (!Array.isArray(value)) return [];
  const byDate = new Map<string, DatedWin>();
  for (const item of value) {
    if (!isWin(item)) continue;
    byDate.set(item.date, { date: item.date, attempts: Number(item.attempts) });
  }
  return [...byDate.values()];
}

export function isGuestId(value: unknown): value is string {
  return typeof value === 'string' && /^guest_[A-Za-z0-9_-]{8,80}$/.test(value);
}

function scoredWins(wins: DatedWin[]): Array<DatedWin & { points: number }> {
  const map: Record<string, number> = {};
  for (const win of wins) map[win.date] = win.attempts;
  return wins.map((win) => ({
    ...win,
    points: pointsForWin(win.attempts, computeStreak(map, win.date))
  }));
}

async function ensureUserRow(admin: Admin, id: string, username: string | null): Promise<void> {
  const { data } = await admin.from('users').select('id, username').eq('id', id).maybeSingle();
  if (data) {
    if (!data.username && username) {
      await admin.from('users').update({ username }).eq('id', id);
    }
    return;
  }
  const { error } = await admin.from('users').insert({ id, username });
  if (error && !/duplicate/i.test(error.message)) {
    throw new Error(error.message);
  }
}

let anonUserId: string | null = null;

async function ensureAnonymousUser(admin: Admin): Promise<string> {
  if (anonUserId) return anonUserId;

  const { data: existing } = await admin
    .from('users')
    .select('id')
    .eq('username', ANON_USERNAME)
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    anonUserId = existing.id;
    return existing.id;
  }

  const created = await admin.auth.admin.createUser({
    email: ANON_EMAIL,
    password: `CineClue-${crypto.randomUUID()}`,
    email_confirm: true,
    user_metadata: { cineclue_anonymous: true }
  });

  let id = created.data.user?.id ?? null;
  if (!id) {
    const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    id = listed.data.users.find((user) => user.email === ANON_EMAIL)?.id ?? null;
  }
  if (!id) {
    throw new Error(created.error?.message ?? 'Impossibile creare il profilo anonimo');
  }

  await ensureUserRow(admin, id, ANON_USERNAME);
  anonUserId = id;
  return id;
}

/** Vittorie di un account: una riga per giorno in daily_scores. */
export async function saveAccountWins(
  userId: string,
  username: string | null,
  wins: DatedWin[]
): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin || wins.length === 0) return;
  await ensureUserRow(admin, userId, username);

  const rows = scoredWins(wins).map((win) => ({
    user_id: userId,
    puzzle_date: win.date,
    attempts: win.attempts,
    points: win.points
  }));

  const { error } = await admin.from('daily_scores').upsert(rows, { onConflict: 'user_id,puzzle_date' });
  if (error) throw new Error(error.message);
}

/**
 * Vittorie senza account. Stanno tutte sul profilo "Cinefilo anonimo",
 * distinte per ospite così lo stesso giorno non si sovrascrive.
 */
export async function saveGuestWins(guestId: string, wins: DatedWin[]): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin || wins.length === 0) return;

  const userId = await ensureAnonymousUser(admin);
  const { data, error: readError } = await admin
    .from('users')
    .select('wins_by_date')
    .eq('id', userId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  const stored = (data?.wins_by_date ?? {}) as Record<string, number>;
  for (const win of wins) {
    stored[`${guestId}|${win.date}`] = win.attempts;
  }

  const { error } = await admin.from('users').update({ wins_by_date: stored }).eq('id', userId);
  if (error) throw new Error(error.message);
}

export interface AnonRow {
  userId: string;
  totalPoints: number;
  totalWins: number;
  currentStreak: number;
}

/** Una riga per ospite: stesso nome in classifica, punteggi separati. */
export async function anonymousRows(admin: Admin): Promise<AnonRow[]> {
  const { data, error } = await admin
    .from('users')
    .select('wins_by_date')
    .eq('username', ANON_USERNAME)
    .limit(1)
    .maybeSingle();
  if (error || !data) return [];

  const byGuest = new Map<string, Record<string, number>>();
  for (const [key, attempts] of Object.entries((data.wins_by_date ?? {}) as Record<string, number>)) {
    const split = key.indexOf('|');
    if (split <= 0 || !Number.isInteger(attempts)) continue;
    const guestId = key.slice(0, split);
    const date = key.slice(split + 1);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const bag = byGuest.get(guestId) ?? {};
    bag[date] = attempts;
    byGuest.set(guestId, bag);
  }

  const rows: AnonRow[] = [];
  for (const [guestId, wins] of byGuest) {
    const dates = Object.keys(wins).sort();
    if (dates.length === 0) continue;
    let totalPoints = 0;
    for (const date of dates) {
      totalPoints += pointsForWin(wins[date], computeStreak(wins, date));
    }
    const latest = dates[dates.length - 1];
    rows.push({
      userId: guestId,
      totalPoints,
      totalWins: dates.length,
      currentStreak: computeStreak(wins, latest)
    });
  }
  return rows;
}
