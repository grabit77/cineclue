import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/app/lib/adminAuth';
import { addDaysUTC, todayUTC } from '@/app/lib/dates';
import { clearDailyMovieCache } from '@/app/lib/dailyMovie';
import { clearOverride, setOverride } from '@/app/lib/schedule';
import { loadMovie } from '@/app/lib/tmdb';

export const dynamic = 'force-dynamic';

function isFuture(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date > todayUTC();
}

export async function POST(request: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  let body: { date?: unknown; movieId?: unknown; clear?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const date = body.date;
  if (typeof date !== 'string' || !isFuture(date) || date > addDaysUTC(todayUTC(), 60)) {
    return NextResponse.json({ error: 'Puoi modificare solo un giorno successivo, entro 60 giorni.' }, { status: 400 });
  }

  const movieId = Number(body.movieId);
  if (body.clear !== true && (!Number.isInteger(movieId) || movieId <= 0)) {
    return NextResponse.json({ error: 'Film non valido' }, { status: 400 });
  }

  try {
    if (body.clear === true) {
      await clearOverride(date);
    } else {
      const movie = await loadMovie(movieId);
      await setOverride(date, {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        posterPath: movie.posterPath
      });
    }
    clearDailyMovieCache(date);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Film non trovato';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
