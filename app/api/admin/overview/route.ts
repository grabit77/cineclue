import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/app/lib/adminAuth';
import { addDaysUTC, puzzleNumber, todayUTC } from '@/app/lib/dates';
import { resolveDailyMovieId } from '@/app/lib/dailyMovie';
import { ANON_USERNAME, anonymousRows } from '@/app/lib/scoreStore';
import { readSchedule } from '@/app/lib/schedule';
import { getSupabaseAdmin, isSupabaseServerReady } from '@/app/lib/supabaseServer';
import { loadMovie } from '@/app/lib/tmdb';

export const dynamic = 'force-dynamic';

const HORIZON = 21;

export async function GET() {
  if (!isAdminRequest()) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const today = todayUTC();
  const schedule = await readSchedule();
  const days = await Promise.all(
    Array.from({ length: HORIZON }, async (_, index) => {
      const date = addDaysUTC(today, index);
      const id = await resolveDailyMovieId(date);
      const movie = await loadMovie(id);
      const manual = schedule.overrides[date] ?? null;
      return {
        date,
        puzzleNumber: puzzleNumber(date),
        locked: date <= today,
        manual: Boolean(manual),
        movie: {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          posterPath: movie.posterPath
        }
      };
    })
  );

  if (!isSupabaseServerReady()) {
    return NextResponse.json({
      days,
      rows: [],
      stats: { accounts: 0, anonymous: 0, wins: 0, points: 0 }
    });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ days, rows: [], stats: { accounts: 0, anonymous: 0, wins: 0, points: 0 } });
  }

  const { data } = await admin.from('daily_scores').select('user_id, points, users(id, username, current_streak)');
  const aggregate = new Map<
    string,
    { userId: string; username: string | null; totalPoints: number; totalWins: number; currentStreak: number }
  >();

  for (const row of data ?? []) {
    const user = row.users as unknown as { id: string; username: string | null; current_streak: number } | null;
    if (!user || user.username === ANON_USERNAME) continue;
    const current = aggregate.get(row.user_id) ?? {
      userId: row.user_id,
      username: user.username,
      totalPoints: 0,
      totalWins: 0,
      currentStreak: Number(user.current_streak ?? 0)
    };
    current.totalPoints += Number(row.points ?? 0);
    current.totalWins += 1;
    aggregate.set(row.user_id, current);
  }

  const anon = await anonymousRows(admin);
  for (const row of anon) {
    aggregate.set(row.userId, {
      userId: row.userId,
      username: ANON_USERNAME,
      totalPoints: row.totalPoints,
      totalWins: row.totalWins,
      currentStreak: row.currentStreak
    });
  }

  const rows = [...aggregate.values()].sort((a, b) => b.totalPoints - a.totalPoints || b.totalWins - a.totalWins);
  const accounts = rows.filter((row) => row.username !== ANON_USERNAME).length;
  const anonymous = rows.filter((row) => row.username === ANON_USERNAME).length;

  return NextResponse.json({
    days,
    rows,
    stats: {
      accounts,
      anonymous,
      wins: rows.reduce((sum, row) => sum + row.totalWins, 0),
      points: rows.reduce((sum, row) => sum + row.totalPoints, 0)
    }
  });
}
