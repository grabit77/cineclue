import { seededInt } from './hash';
import type { CategoryHint, Guess, HintCategory, MovieInfo, PuzzleDate } from './types';

/** Ordine fisso: lo spostamento del giorno è dato dal seed, non da un random locale. */
const CATEGORIES: HintCategory[] = ['year', 'country', 'director', 'genre', 'cast', 'runtime'];

const LABELS: Record<HintCategory, string> = {
  year: 'Anno',
  country: 'Paese',
  director: 'Regista',
  genre: 'Genere',
  cast: 'Protagonista',
  runtime: 'Durata'
};

function isSolved(category: HintCategory, guess: Guess): boolean {
  const f = guess.feedback;
  switch (category) {
    case 'year':
      return f.year.status === 'exact';
    case 'country':
      return f.country?.status === 'match';
    case 'director':
      return f.director.status === 'match';
    case 'genre':
      return f.genre.status === 'match';
    case 'cast':
      return f.cast.status === 'match';
    case 'runtime':
      return f.runtime.status === 'exact';
    default:
      return false;
  }
}

/** Categorie già indovinate nei primi tre tentativi (quelle che il suggerimento deve saltare). */
export function solvedHintCategories(guesses: Guess[]): HintCategory[] {
  const solved = new Set<HintCategory>();
  for (const guess of guesses.slice(0, 3)) {
    for (const category of CATEGORIES) {
      if (isSolved(category, guess)) solved.add(category);
    }
  }
  return CATEGORIES.filter((category) => solved.has(category));
}

/**
 * Sceglie una categoria non ancora indovinata.
 * Stessa data e stesso insieme di categorie risolte => stesso risultato per tutti.
 */
export function pickHintCategory(date: PuzzleDate, solved: readonly HintCategory[]): HintCategory | null {
  const solvedSet = new Set(solved);
  const available = CATEGORIES.filter((category) => !solvedSet.has(category));
  if (available.length === 0) return null;

  const start = seededInt(`${date}::hint`, CATEGORIES.length);
  for (let offset = 0; offset < CATEGORIES.length; offset++) {
    const category = CATEGORIES[(start + offset) % CATEGORIES.length];
    if (!solvedSet.has(category)) return category;
  }
  return null;
}

export function hintLabel(category: HintCategory): string {
  return LABELS[category];
}

/** Testo del valore rivelato. Il cast è sempre il primo attore in locandina. */
export function hintValue(movie: MovieInfo, category: HintCategory): string | null {
  switch (category) {
    case 'year':
      return movie.year != null ? String(movie.year) : null;
    case 'country': {
      const names = movie.countries.map((c) => c.name).filter(Boolean);
      return names.length > 0 ? names.join(', ') : null;
    }
    case 'director':
      return movie.director.name;
    case 'genre': {
      const names = movie.genres.map((g) => g.name).filter(Boolean);
      return names.length > 0 ? names.join(', ') : null;
    }
    case 'cast':
      return movie.cast[0]?.name ?? null;
    case 'runtime':
      return movie.runtimeMinutes != null ? `${movie.runtimeMinutes} min` : null;
    default:
      return null;
  }
}

export function buildCategoryHint(
  date: PuzzleDate,
  movie: MovieInfo,
  solved: readonly HintCategory[]
): CategoryHint | null {
  const category = pickHintCategory(date, solved);
  if (!category) return null;
  const value = hintValue(movie, category);
  if (!value) {
    const rest = CATEGORIES.filter((item) => item !== category && !solved.includes(item));
    for (const fallback of rest) {
      const fallbackValue = hintValue(movie, fallback);
      if (fallbackValue) {
        return { category: fallback, label: hintLabel(fallback), value: fallbackValue };
      }
    }
    return null;
  }
  return { category, label: hintLabel(category), value };
}
