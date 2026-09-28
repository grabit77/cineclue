// Tipi condivisi tra client e server.

/** Data in formato UTC "YYYY-MM-DD" (il puzzle del giorno è globale e basato su UTC). */
export type PuzzleDate = string;

export type FeedbackStatusYear = 'exact' | 'up' | 'down';
export type FeedbackStatusBinary = 'match' | 'no';
export type FeedbackStatusGenre = 'match' | 'partial' | 'no';
export type FeedbackStatusCast = 'match' | 'partial' | 'no';

export interface FeedbackYear {
  status: FeedbackStatusYear;
  /** Anno del film indovinato (per visualizzazione). */
  value: number | null;
}

export interface FeedbackDirector {
  status: FeedbackStatusBinary;
  /** Nome del regista del film indovinato. */
  name: string | null;
}

export interface FeedbackGenre {
  status: FeedbackStatusGenre;
  /** Genere principale del film indovinato. */
  name: string | null;
}

export interface FeedbackCountry {
  status: FeedbackStatusGenre;
  /** Paese di produzione principale del film indovinato. */
  name: string | null;
}

export interface FeedbackCast {
  status: FeedbackStatusCast;
  /** Nomi degli attori in comune (primi 10 dei crediti). */
  shared: string[];
}

export interface FeedbackRuntime {
  status: FeedbackStatusYear; // 'exact' | 'up' | 'down'
  /** Durata in minuti del film indovinato. */
  value: number | null;
}

export interface GuessFeedback {
  year: FeedbackYear;
  country: FeedbackCountry;
  director: FeedbackDirector;
  genre: FeedbackGenre;
  cast: FeedbackCast;
  runtime: FeedbackRuntime;
}

/** Un tentativo giocato (film selezionato dall'utente + feedback ricevuto). */
export interface Guess {
  id: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  feedback: GuessFeedback;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export type HintCategory = 'year' | 'country' | 'director' | 'genre' | 'cast' | 'runtime';

/** Suggerimento sbloccato al 4° tentativo: una categoria ancora non indovinata. */
export interface CategoryHint {
  category: HintCategory;
  /** Etichetta italiana della categoria (Anno, Paese, …). */
  label: string;
  /** Valore rivelato del film segreto. */
  value: string;
}

export interface GameState {
  date: PuzzleDate;
  puzzleNumber: number;
  status: GameStatus;
  guesses: Guess[];
  /** Tentativo (1-6) con cui si è vinto, se vinto. */
  wonAtAttempt: number | null;
  /** Presente dal 4° tentativo in poi. Resta lo stesso per tutta la partita. */
  hint?: CategoryHint | null;
}

export interface Profile {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  /** Quante vittorie sono arrivate al tentativo N (chiavi 1..6). */
  distribution: Record<string, number>;
  /** mappa data -> tentativi usati per la vittoria (per ricalcolo streak). */
  winsByDate: Record<string, number>;
  /** date perse (per gestione streak). */
  lostOnDates: Record<string, boolean>;
  lastPlayedDate: PuzzleDate | null;
}

export const MAX_ATTEMPTS = 6;

export interface SubmitGuessResult {
  won: boolean;
  attemptsUsed: number;
  movie: {
    id: number;
    title: string;
    year: number | null;
    posterPath: string | null;
  };
  feedback: GuessFeedback;
}

export interface SearchResult {
  id: number;
  title: string;
  year: number | null;
  posterPath: string | null;
}

export interface DailyInfo {
  date: PuzzleDate;
  puzzleNumber: number;
  tmdbConfigured: boolean;
  /** Se cambia, il browser scarta punteggi e partite locali. */
  resetAt: string | null;
}

export interface LeaderboardEntry {
  userId: string;
  username: string | null;
  totalPoints: number | null;
  totalWins: number;
  currentStreak: number;
}

/** Tipo minimo del film normalizzato proveniente da TMDb. */
export interface MovieInfo {
  id: number;
  title: string;
  year: number | null;
  runtimeMinutes: number | null;
  genres: { id: number; name: string }[];
  countries: { iso: string; name: string }[];
  director: { id: number | null; name: string | null };
  cast: { id: number; name: string }[];
  posterPath: string | null;
}