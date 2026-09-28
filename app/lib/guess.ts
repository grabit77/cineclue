import type { GuessFeedback, MovieInfo } from './types';

/**
 * Confronta il film segreto col film indovinato e produce il feedback.
 * Nota: restituisce SOLO le informazioni del film indovinato + feedback:
 * il titolo del film segreto non esce MAI da questa funzione.
 */

const RUNTIME_TOLERANCE_MIN = 5;

function compareYear(secret: MovieInfo, guess: MovieInfo): GuessFeedback['year'] {
  const gy = guess.year;
  const sy = secret.year;
  if (gy == null || sy == null) {
    return { status: 'down', value: gy }; // dati mancanti: tratta come "diverso"
  }
  if (gy === sy) return { status: 'exact', value: gy };
  // Il segreto è uscito l'anno successivo => freccia su.
  return { status: sy > gy ? 'up' : 'down', value: gy };
}

function compareCountry(secret: MovieInfo, guess: MovieInfo): GuessFeedback['country'] {
  const name = guess.countries[0]?.name ?? null;
  const guessPrimary = guess.countries[0]?.iso ?? null;
  const secretPrimary = secret.countries[0]?.iso ?? null;
  if (!guessPrimary || !secretPrimary) {
    return { status: 'no', name };
  }
  if (guessPrimary === secretPrimary) {
    return { status: 'match', name };
  }
  const secretIsos = new Set(secret.countries.map((c) => c.iso));
  const shared = guess.countries.some((c) => secretIsos.has(c.iso));
  return { status: shared ? 'partial' : 'no', name };
}

function compareDirector(secret: MovieInfo, guess: MovieInfo): GuessFeedback['director'] {
  const gd = guess.director;
  if (!gd.id || !gd.name) {
    return { status: 'no', name: gd.name };
  }
  if (secret.director.id != null && secret.director.id === gd.id) {
    return { status: 'match', name: gd.name };
  }
  return { status: 'no', name: gd.name };
}

function compareGenre(secret: MovieInfo, guess: MovieInfo): GuessFeedback['genre'] {
  const primary = guess.genres[0]?.name ?? null;
  if (secret.genres.length === 0 || guess.genres.length === 0) {
    return { status: 'no', name: primary };
  }
  // Genere principale identico (stesso id).
  if (guess.genres[0].id === secret.genres[0].id) {
    return { status: 'match', name: primary };
  }
  // Giallo: mostra i generi del film segreto davvero in comune, non il principale del tentativo.
  const guessIds = new Set(guess.genres.map((g) => g.id));
  const shared = secret.genres.filter((g) => guessIds.has(g.id)).map((g) => g.name);
  if (shared.length > 0) {
    return { status: 'partial', name: shared.join(', ') };
  }
  return { status: 'no', name: primary };
}

function compareCast(secret: MovieInfo, guess: MovieInfo): GuessFeedback['cast'] {
  const guessIds = new Set(guess.cast.map((a) => a.id));
  const secretIds = new Set(secret.cast.map((a) => a.id));

  const allMatch =
    guess.cast.length > 0 &&
    guess.cast.length === secret.cast.length &&
    guess.cast.every((a) => secretIds.has(a.id));

  if (allMatch) return { status: 'match', shared: [] };

  const shared = guess.cast.filter((a) => secretIds.has(a.id)).map((a) => a.name);
  return { status: shared.length > 0 ? 'partial' : 'no', shared };
}

function compareRuntime(secret: MovieInfo, guess: MovieInfo): GuessFeedback['runtime'] {
  const gr = guess.runtimeMinutes;
  const sr = secret.runtimeMinutes;
  if (gr == null || sr == null) {
    return { status: 'down', value: gr };
  }
  if (Math.abs(gr - sr) <= RUNTIME_TOLERANCE_MIN) return { status: 'exact', value: gr };
  return { status: sr > gr ? 'up' : 'down', value: gr };
}

export function computeFeedback(secret: MovieInfo, guess: MovieInfo): GuessFeedback {
  return {
    year: compareYear(secret, guess),
    country: compareCountry(secret, guess),
    director: compareDirector(secret, guess),
    genre: compareGenre(secret, guess),
    cast: compareCast(secret, guess),
    runtime: compareRuntime(secret, guess)
  };
}