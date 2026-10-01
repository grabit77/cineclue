import { NextResponse } from 'next/server';
import { createServerClient } from '@/app/lib/authServer';
import { resolveDailyMovieId } from '@/app/lib/dailyMovie';
import { computeFeedback } from '@/app/lib/guess';
import { readAccountPlay } from '@/app/lib/scoreStore';
import { isTmdbConfigured, loadMovie } from '@/app/lib/tmdb';
import { isValidPuzzleDate } from '@/app/lib/dates';
import type { SubmitGuessResult } from '@/app/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isTmdbConfigured()) {
    return NextResponse.json(
      { error: 'TMDb non configurato: imposta la variabile TMDB_API_KEY.' },
      { status: 503 }
    );
  }

  let body: { movieId?: unknown; date?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const movieId = Number(body.movieId);
  const date = body.date;

  if (!Number.isInteger(movieId) || movieId <= 0) {
    return NextResponse.json({ error: 'Invia un movieId valido' }, { status: 400 });
  }
  if (typeof date !== 'string' || !isValidPuzzleDate(date)) {
    return NextResponse.json({ error: 'Data non valida' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) {
      const play = await readAccountPlay(user.id, date);
      if (play && play.outcome !== 'playing') {
        return NextResponse.json(
          {
            error: 'Hai già giocato oggi con questo account.',
            played: true,
            outcome: play.outcome,
            attempts: play.attempts,
            guesses: play.guesses
          },
          { status: 409 }
        );
      }
    }

    const secretId = await resolveDailyMovieId(date);
    const [secret, guess] = await Promise.all([loadMovie(secretId), loadMovie(movieId)]);

    const feedback = computeFeedback(secret, guess);
    const won = secretId === guess.id;

    const result: SubmitGuessResult = {
      won,
      attemptsUsed: 0, // valorizzato dal client (che conosce la posizione nel turno)
      movie: {
        id: guess.id,
        title: guess.title,
        year: guess.year,
        posterPath: guess.posterPath
      },
      feedback
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    return NextResponse.json(
      { error: `Impossibile caricare i film: ${message}` },
      { status: 500 }
    );
  }
}