import { NextResponse } from 'next/server';
import { ANON_USERNAME } from '@/app/lib/scoreStore';
import { isSupabaseServerReady, getSupabaseAdmin } from '@/app/lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * Classifica globale: solo gli account. Le partite anonime restano nel browser.
 */
export async function GET() {
  if (!isSupabaseServerReady()) {
    return NextResponse.json({ rows: [], setupRequired: false });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ rows: [], setupRequired: false });
  }

  const { data, error } = await supabase
    .from('daily_scores')
    .select('user_id, points, users(id, username, current_streak)');

  if (error) {
    console.error('[cineclue] classifica non disponibile:', error.message);
    return NextResponse.json({ rows: [], setupRequired: true });
  }

  const aggregate = new Map<
    string,
    { userId: string; username: string | null; totalPoints: number; totalWins: number; currentStreak: number }
  >();

  for (const row of data ?? []) {
    const user = row.users as unknown as {
      id: string;
      username: string | null;
      current_streak: number;
    } | null;
    if (!user || user.username === ANON_USERNAME) continue;

    const points = Number(row.points ?? 0);
    const current = aggregate.get(row.user_id) ?? {
      userId: row.user_id,
      username: user.username ?? null,
      totalPoints: 0,
      totalWins: 0,
      currentStreak: Number(user.current_streak ?? 0)
    };
    current.totalPoints += points;
    current.totalWins += 1;
    aggregate.set(row.user_id, current);
  }

  const rows = [...aggregate.values()]
    .sort((a, b) => b.totalPoints - a.totalPoints || b.totalWins - a.totalWins)
    .slice(0, 50);

  return NextResponse.json({ rows });
}
