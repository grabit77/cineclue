import { NextResponse } from 'next/server';
import { readEndless } from '@/app/lib/endlessToken';
import { buildCategoryHint } from '@/app/lib/hint';
import { contentLocale, isTmdbConfigured, loadMovie } from '@/app/lib/tmdb';
import type { HintCategory } from '@/app/lib/types';

export const dynamic = 'force-dynamic';

const CATEGORIES: HintCategory[] = ['year', 'country', 'director', 'genre', 'cast', 'runtime'];

function parseSolved(value: unknown): HintCategory[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is HintCategory => CATEGORIES.includes(item as HintCategory));
}

export async function POST(request: Request) {
  if (!isTmdbConfigured()) {
    return NextResponse.json(
      { error: 'TMDb non configurato: imposta la variabile TMDB_API_KEY.' },
      { status: 503 }
    );
  }

  let body: { token?: unknown; solved?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const payload = readEndless(body.token);
  if (!payload) return NextResponse.json({ error: 'Partita non valida' }, { status: 400 });

  try {
    const secret = await loadMovie(payload.id, contentLocale(body.lang));
    const hint = buildCategoryHint(`endless-${payload.id}`, secret, parseSolved(body.solved));
    return NextResponse.json({ hint });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    return NextResponse.json({ error: `Impossibile preparare il suggerimento: ${message}` }, { status: 500 });
  }
}
