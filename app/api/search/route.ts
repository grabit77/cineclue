import { NextResponse } from 'next/server';
import { isTmdbConfigured, searchMovies } from '@/app/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isTmdbConfigured()) {
    return NextResponse.json(
      { error: 'TMDb non configurato: imposta la variabile TMDB_API_KEY.' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();

  if (!q) return NextResponse.json({ results: [] });

  const results = await searchMovies(q);
  return NextResponse.json({ results });
}