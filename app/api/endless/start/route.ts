import { NextResponse } from 'next/server';
import { signEndless } from '@/app/lib/endlessToken';
import { MOVIE_POOL_IDS } from '@/app/lib/moviePool';
import { isTmdbConfigured, movieExists } from '@/app/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!isTmdbConfigured()) {
    return NextResponse.json(
      { error: 'TMDb non configurato: imposta la variabile TMDB_API_KEY.' },
      { status: 503 }
    );
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const id = MOVIE_POOL_IDS[Math.floor(Math.random() * MOVIE_POOL_IDS.length)];
    if (await movieExists(id)) {
      return NextResponse.json({ token: signEndless({ id, guesses: [] }) });
    }
  }

  return NextResponse.json({ error: 'Nessun film valido nel pool' }, { status: 500 });
}
