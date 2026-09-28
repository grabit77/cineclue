import { addDaysUTC } from '@/app/lib/dates';

import type {
  GameState,
  Profile,
  PuzzleDate
} from '@/app/lib/types';

/* ------------------------------------------------------------------ */
/*  Persistenza in localStorage (modalità Guest).                      */
/* ------------------------------------------------------------------ */

const STATE_PREFIX = 'cineclue:game:';
const PROFILE_KEY = 'cineclue:profile';

function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function loadObject<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveObject<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage pieno o non disponibile: ignora */
  }
}

export function removeKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

/* ------------------------------------------------------------------ */
/*  Stato della partita del giorno.                                    */
/* ------------------------------------------------------------------ */

export function stateKey(date: PuzzleDate): string {
  return `${STATE_PREFIX}${date}`;
}

export function loadGameState(date: PuzzleDate): GameState | null {
  return loadObject<GameState>(stateKey(date));
}

export function saveGameState(state: GameState): void {
  saveObject(stateKey(state.date), state);
}

const SERVER_RESET_KEY = 'cineclue:serverResetAt';

/** Dopo un reset dal pannello, scarta partite e punteggi rimasti nel browser. */
export function applyServerReset(resetAt: string | null): void {
  if (!resetAt || typeof window === 'undefined') return;
  if (window.localStorage.getItem(SERVER_RESET_KEY) === resetAt) return;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && (key.startsWith(STATE_PREFIX) || key === PROFILE_KEY || key === 'cineclue.syncedScores')) {
      keys.push(key);
    }
  }
  for (const key of keys) removeKey(key);
  window.localStorage.setItem(SERVER_RESET_KEY, resetAt);
}

export function staleStates(exceptDate: PuzzleDate): { key: string; date: PuzzleDate }[] {
  if (typeof window === 'undefined') return [];
  const out: { key: string; date: PuzzleDate }[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(STATE_PREFIX)) {
      const date = key.slice(STATE_PREFIX.length);
      if (date !== exceptDate && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        out.push({ key, date });
      }
    }
  }
  return out;
}

export function cleanupOldStates(exceptDate: PuzzleDate): void {
  for (const stale of staleStates(exceptDate)) {
    removeKey(stale.key);
  }
}

/* ------------------------------------------------------------------ */
/*  Profilo / statistiche.                                             */
/* ------------------------------------------------------------------ */

export function defaultProfile(): Profile {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
    winsByDate: {},
    lostOnDates: {},
    lastPlayedDate: null
  };
}

export function loadProfile(): Profile {
  return loadObject<Profile>(PROFILE_KEY) ?? defaultProfile();
}

export function saveProfile(profile: Profile): void {
  saveObject(PROFILE_KEY, profile);
}

export const guestIdKey = 'cineclue:guestId';

export function guestId(): string {
  let id = loadObject<string>(guestIdKey);
  if (!id) {
    id = `guest_${uid()}`;
    saveObject(guestIdKey, id);
  }
  return id;
}

/** Streak attuale: giorni consecutivi di vittoria a ritroso da `from`. */
export function computeStreak(winsByDate: Record<string, number>, from: PuzzleDate): number {
  let streak = 0;
  let cursor = from;
  for (;;) {
    if (winsByDate[cursor]) {
      streak++;
      cursor = addDaysUTC(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

/** Massimo run consecutivo di vittorie (scavando indietro fino al win più vecchio). */
export function computeMaxStreak(winsByDate: Record<string, number>, from: PuzzleDate): number {
  const keys = Object.keys(winsByDate);
  if (keys.length === 0) return 0;
  const oldest = keys.reduce((a, b) => (a < b ? a : b));
  let max = 0;
  let run = 0;
  let cursor = from;
  while (cursor >= oldest) {
    if (winsByDate[cursor]) {
      run++;
      if (run > max) max = run;
    } else {
      run = 0;
    }
    if (cursor === oldest) break;
    cursor = addDaysUTC(cursor, -1);
  }
  return max;
}

export interface ResultOutcome {
  won: boolean;
  attempts: number | null;
  date: PuzzleDate;
  points: number;
}

/**
 * Registra l'esito di una partita nel profilo e restituisce il profilo
 * aggiornato (gestisce streak, max streak e distribuzione tentativi).
 */
export function applyResult(profile: Profile, outcome: ResultOutcome): Profile {
  const next: Profile = {
    ...profile,
    distribution: { ...profile.distribution },
    winsByDate: { ...profile.winsByDate },
    lostOnDates: { ...profile.lostOnDates }
  };

  next.gamesPlayed += 1;
  next.lastPlayedDate = outcome.date;

  if (outcome.won && outcome.attempts != null) {
    next.gamesWon += 1;
    next.winsByDate[outcome.date] = outcome.attempts;
    next.distribution[String(outcome.attempts)] =
      (next.distribution[String(outcome.attempts)] ?? 0) + 1;
    next.currentStreak = computeStreak(next.winsByDate, outcome.date);
    next.maxStreak = Math.max(next.maxStreak, computeMaxStreak(next.winsByDate, outcome.date));
  } else {
    next.lostOnDates[outcome.date] = true;
    next.currentStreak = 0;
  }

  return next;
}

/** Punti: (7 - tentativi) * 100 + streak (aggiornata) * 10. */
export function pointsForWin(attempts: number, newStreak: number): number {
  return (7 - attempts) * 100 + newStreak * 10;
}