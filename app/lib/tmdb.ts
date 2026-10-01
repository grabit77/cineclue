import type { MovieInfo, SearchResult } from './types';

/* ------------------------------------------------------------------ */
/*  Client TMDb (solo server). Tutte le chiamate girano in route API. */
/* ------------------------------------------------------------------ */

const TMDB_API_KEY = process.env.TMDB_API_KEY ?? '';
const TMDB_LANG = process.env.TMDB_LANGUAGE || 'it-IT';
const TMDB_BASE = 'https://api.themoviedb.org/3';

export type ContentLocale = 'it' | 'en';

export function contentLocale(value: unknown): ContentLocale {
  return value === 'en' ? 'en' : 'it';
}

function tmdbLanguage(locale?: ContentLocale): string {
  if (locale === 'en') return 'en-US';
  if (locale === 'it') return 'it-IT';
  return TMDB_LANG;
}

export function isTmdbConfigured(): boolean {
  return !!TMDB_API_KEY && TMDB_API_KEY !== 'tmdb_key_placeholder';
}

function tmdbUrl(path: string, params: Record<string, string> = {}, locale?: ContentLocale): string {
  const qs = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: tmdbLanguage(locale),
    ...params
  });
  return `${TMDB_BASE}${path}?${qs.toString()}`;
}

interface TmdbCredits {
  cast?: Array<{ id: number; name: string; order?: number | null; adult?: boolean }>;
  crew?: Array<{ id: number; name: string; job?: string }>;
}

interface TmdbMovie {
  id: number;
  title?: string;
  original_title?: string;
  release_date?: string | null;
  runtime?: number | null;
  genres?: Array<{ id: number; name: string }>;
  production_countries?: Array<{ iso_3166_1?: string; name?: string }>;
  poster_path?: string | null;
  adult?: boolean;
  /** Presente quando si usa append_to_response=credits. */
  credits?: TmdbCredits;
  cast?: TmdbCredits['cast'];
  crew?: TmdbCredits['crew'];
}

/* ------------------------------------------------------------------ */
/*  Cache in-memory (semplice, condivisa tra i bucket di Next.js).     */
/* ------------------------------------------------------------------ */

const memoryCache = new Map<string, unknown>();

async function tmdbGet<T>(url: string): Promise<T> {
  const cached = memoryCache.get(url);
  if (cached) return cached as T;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`TMDb ${res.status}: ${await res.text().then((t) => t.slice(0, 200))}`);
  }
  const data = (await res.json()) as T;
  memoryCache.set(url, data);
  return data;
}

/* ------------------------------------------------------------------ */
/*  Normalizzazione dei dati di un film.                               */
/* ------------------------------------------------------------------ */

function toSearchResult(m: TmdbMovie): SearchResult {
  return {
    id: m.id,
    title: m.title || m.original_title || 'Sconosciuto',
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    posterPath: m.poster_path ?? null
  };
}

export async function searchMovies(query: string, locale?: ContentLocale): Promise<SearchResult[]> {
  const data = await tmdbGet<{ results?: TmdbMovie[] }>(tmdbUrl('/search/movie', { query }, locale));
  return (data.results ?? [])
    .filter((m) => !!m.id && !m.adult)
    .slice(0, 8)
    .map(toSearchResult);
}

function pickYear(releaseDate?: string | null): number | null {
  if (!releaseDate) return null;
  const y = Number(releaseDate.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

function countryName(iso: string, fallback: string, locale?: ContentLocale): string {
  try {
    const names = new Intl.DisplayNames([locale === 'en' ? 'en' : 'it'], { type: 'region' });
    return names.of(iso) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function loadMovie(id: number, locale?: ContentLocale): Promise<MovieInfo> {
  const data = await tmdbGet<TmdbMovie>(
    tmdbUrl(`/movie/${id}`, { append_to_response: 'credits' }, locale)
  );

  const credits = data.credits ?? data;
  const cast = (credits.cast ?? [])
    .filter((c) => c.id && !c.adult)
    .sort((a, b) => {
      const ao = typeof a.order === 'number' ? a.order : 999;
      const bo = typeof b.order === 'number' ? b.order : 999;
      return ao - bo;
    })
    .slice(0, 10)
    .map(({ id, name }) => ({ id, name }));

  const directorObj = (credits.crew ?? []).find((c) => c.job === 'Director');

  return {
    id: data.id,
    title: data.title || data.original_title || `Film #${data.id}`,
    year: pickYear(data.release_date),
    runtimeMinutes: data.runtime ?? null,
    genres: (data.genres ?? []).map((g) => ({ id: g.id, name: g.name })),
    countries: (data.production_countries ?? [])
      .filter((c): c is { iso_3166_1: string; name: string } => !!c.iso_3166_1 && !!c.name)
      .map((c) => ({ iso: c.iso_3166_1, name: countryName(c.iso_3166_1, c.name, locale) })),
    director: {
      id: directorObj?.id ?? null,
      name: directorObj?.name ?? null
    },
    cast,
    posterPath: data.poster_path ?? null
  };
}

/** Verifica che un id esista su TMDb (per il self-healing del pool). */
export async function movieExists(id: number): Promise<boolean> {
  try {
    await tmdbGet<TmdbMovie>(tmdbUrl(`/movie/${id}`));
    return true;
  } catch {
    return false;
  }
}