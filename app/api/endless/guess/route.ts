import { NextResponse } from 'next/server';
import { readEndless, signEndless } from '@/app/lib/endlessToken';
import { computeFeedback } from '@/app/lib/guess';
import { contentLocale, isTmdbConfigured, loadMovie } from '@/app/lib/tmdb';
import { MAX_ATTEMPTS } from '@/app/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isTmdbConfigured()) {
    return NextResponse.json(
      { error: 'TMDb non configurato: imposta la variabile TMDB_API_KEY.' },
      { status: 503 }
    );
  }

  let body: { token?: unknown; movieId?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const payload = readEndless(body.token);
  const movieId = Number(body.movieId);
  if (!payload) return NextResponse.json({ error: 'Partita non valida' }, { status: 400 });
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return NextResponse.json({ error: 'Invia un movieId valido' }, { status: 400 });
  }
  if (payload.guesses.includes(movieId)) {
    return NextResponse.json({ error: 'Hai già provato questo film.' }, { status: 409 });
  }
  if (payload.guesses.length >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'Partita già conclusa' }, { status: 409 });
  }

  try {
    const locale = contentLocale(body.lang);
    const [secret, guess] = await Promise.all([loadMovie(payload.id, locale), loadMovie(movieId, locale)]);
    const guesses = [...payload.guesses, movieId];
    const won = movieId === payload.id;
    const done = won || guesses.length >= MAX_ATTEMPTS;

    return NextResponse.json({
      token: signEndless({ id: payload.id, guesses }),
      won,
      done,
      movie: {
        id: guess.id,
        title: guess.title,
        year: guess.year,
        posterPath: guess.posterPath
      },
      feedback: computeFeedback(secret, guess),
      reveal: done
        ? {
            id: secret.id,
            title: secret.title,
            year: secret.year,
            posterPath: secret.posterPath
          }
        : null
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    return NextResponse.json({ error: `Impossibile caricare i film: ${message}` }, { status: 500 });
  }
}
