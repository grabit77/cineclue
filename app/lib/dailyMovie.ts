import { seededInt } from './hash';
import { MOVIE_POOL_IDS } from './moviePool';
import { overrideFor } from './schedule';
import { movieExists } from './tmdb';
import { isValidPuzzleDate } from './dates';
import type { PuzzleDate } from './types';

/**
 * Risolve l'id TMDb del "Film del Giorno" in modo DETERMINISTICO:
 * stesso input (data UTC YYYY-MM-DD) => stesso film per tutti.
 *
 * Strategia self-healing: se l'id puntato dall'hash non esiste su TMDb
 * (pool modificato male o film cancellato), scorre in modo deterministico
 * gli elementi successivi finché non trova un film valido. La sequenza di
 * fallback è identica per tutti, quindi il puzzle resta globale e stabile.
 */

const resolvedCache = new Map<string, number>();

export function clearDailyMovieCache(date?: PuzzleDate): void {
  if (date) resolvedCache.delete(date);
  else resolvedCache.clear();
}

export async function resolveDailyMovieId(date: PuzzleDate): Promise<number> {
  if (!isValidPuzzleDate(date)) {
    throw new Error('Data non valida');
  }

  const chosen = await overrideFor(date);
  if (chosen && (await movieExists(chosen.id))) {
    return chosen.id;
  }

  const cached = resolvedCache.get(date);
  if (cached) return cached;

  const start = seededInt(date, MOVIE_POOL_IDS.length);

  for (let offset = 0; offset < MOVIE_POOL_IDS.length; offset++) {
    const candidate = MOVIE_POOL_IDS[(start + offset) % MOVIE_POOL_IDS.length];
    if (await movieExists(candidate)) {
      resolvedCache.set(date, candidate);
      return candidate;
    }
  }

  throw new Error('Nessun film valido nel pool');
}