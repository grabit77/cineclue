'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Locale = 'it' | 'en';

const STORAGE_KEY = 'cineclue:locale';

export interface Messages {
  metaTitle: string;
  metaDescription: string;
  loading: string;
  projectors: string;
  puzzleOfDay: (n: number) => string;
  stats: string;
  yourStats: string;
  leaderboard: string;
  signIn: string;
  signInTitle: string;
  profile: string;
  signOut: string;
  account: string;
  guessTitle: string;
  guessHeadingBefore: string;
  guessHeadingAfter: string;
  attemptsLeft: (n: number) => string;
  compareHint: string;
  hint: string;
  legend: string;
  legendExact: string;
  legendPartial: string;
  legendWrong: string;
  legendArrows: string;
  footer: string;
  coffee: string;
  searchPlaceholder: string;
  searchDone: string;
  searchScoring: string;
  searchUnavailable: string;
  searchFailed: string;
  searching: (q: string) => string;
  noMovies: (q: string) => string;
  unknownYear: string;
  columns: { year: string; country: string; director: string; genre: string; cast: string; runtime: string };
  yearAfter: string;
  yearBefore: string;
  runtimeLonger: string;
  runtimeShorter: string;
  castFull: string;
  castShared: (names: string) => string;
  castNone: string;
  attemptPick: (n: number) => string;
  attemptLine: (n: number, year: string) => string;
  winBadge: string;
  emptyAttempt: string;
  winTitle: (n: number) => string;
  gameOver: string;
  winBody: (attempts: number, points: number, streak: number) => string;
  loseBody: (n: number) => string;
  share: string;
  copy: string;
  copied: string;
  nextFilm: string;
  shareStreak: (n: number) => string;
  shareCta: (site: string) => string;
  played: string;
  won: string;
  streak: string;
  max: string;
  winRate: string;
  distribution: string;
  pointsRule: string;
  lbEmpty: string;
  lbSetup: string;
  lbSetupHint: string;
  lbUnavailable: string;
  winsCount: (n: number) => string;
  points: string;
  you: string;
  prevPage: string;
  nextPage: string;
  player: string;
  authTitle: string;
  guestOnly: string;
  guestSetup: string;
  accountLinked: string;
  synced: string;
  signOutAccount: string;
  authIntro: string;
  register: string;
  email: string;
  password: string;
  forgot: string;
  leaderboardName: string;
  namePlaceholder: string;
  passwordMin: string;
  confirmPassword: string;
  repeatPassword: string;
  forgotHelp: string;
  sendReset: string;
  backToSignIn: string;
  errEmailPassword: string;
  errName: string;
  errPasswordShort: string;
  errPasswordMatch: string;
  errEmailRequired: string;
  errConfirmEmail: string;
  errResetSent: string;
  errGeneric: string;
  errRateLimit: string;
  errBadLogin: string;
  errExists: string;
  errAlreadyTried: string;
  errServer: string;
  errAlreadyPlayed: string;
  resetTitle: string;
  resetSubtitle: string;
  resetIntro: string;
  newPassword: string;
  savePassword: string;
  passwordUpdated: string;
  resetMissing: string;
  resetAskAgain: string;
  backHome: string;
  supabaseMissing: string;
  setupTitle: string;
  setupBody: string;
  setupStep1: string;
  setupStep2: string;
  setupStep3: string;
  setupEnv: string;
  adminTitle: string;
  adminPassword: string;
  adminEnter: string;
  adminSubtitle: string;
  adminAccounts: string;
  adminAnonymous: string;
  adminWins: string;
  adminPoints: string;
  calendar: string;
  calendarHelp: string;
  today: string;
  chosen: string;
  automatic: string;
  replaceMovie: (date: string) => string;
  searchMovie: string;
  restoreAuto: string;
  noScores: string;
  adminLoadFail: string;
  adminDenied: string;
  adminSaveFail: string;
  language: string;
  close: string;
  resetChecking: string;
  errInvalidEmail: string;
  errSignupFailed: string;
  errTmdb: string;
  errGuess: string;
  errWrongPassword: string;
  errAdminSetup: string;
  errUnauthorized: string;
  errInvalidMovie: string;
  errScheduleWindow: string;
}

const it: Messages = {
  metaTitle: 'CineClue - Il Film del Giorno',
  metaDescription:
    'Indovina il Film del Giorno in 6 tentativi: un nuovo puzzle cinematografico ogni giorno, uguale per tutti nel mondo.',
  loading: 'Caricamento…',
  projectors: 'Si accendono i proiettori…',
  puzzleOfDay: (n) => `Puzzle del giorno #${n}`,
  stats: 'Statistiche',
  yourStats: 'Le tue statistiche',
  leaderboard: 'Classifica globale',
  signIn: 'Accedi',
  signInTitle: 'Accedi con account',
  profile: 'Profilo',
  signOut: 'Esci',
  account: 'Account',
  guessTitle: 'Film del Giorno',
  guessHeadingBefore: 'Indovina il ',
  guessHeadingAfter: '',
  attemptsLeft: (n) =>
    n === 1
      ? 'Hai 1 tentativo a disposizione. Il film si rivela solo se lo indovini: altrimenti, torna domani per un nuovo puzzle.'
      : `Hai ${n} tentativi a disposizione. Il film si rivela solo se lo indovini: altrimenti, torna domani per un nuovo puzzle.`,
  compareHint: 'Confronta anno, paese, regista, genere, cast e durata per avvicinarti al film segreto.',
  hint: 'Suggerimento',
  legend: 'Legenda',
  legendExact: 'Colonna verde = dato esatto',
  legendPartial: 'Giallo = parziale (paese, genere in comune o qualche attore)',
  legendWrong: 'Rosso = dato diverso',
  legendArrows: 'Frecce = il film segreto è uscito o dura di più o di meno',
  footer: 'CineClue — un nuovo puzzle ogni giorno · Dati film © TMDb',
  coffee: 'Offrimi un caffè',
  searchPlaceholder: 'Cerca un film per titolo (es. Inception)…',
  searchDone: 'Partita conclusa: torna domani!',
  searchScoring: 'Valutazione in corso…',
  searchUnavailable: 'Ricerca non disponibile',
  searchFailed: 'Impossibile contattare il motore di ricerca.',
  searching: (q) => `Cerco "${q}"…`,
  noMovies: (q) => `Nessun film trovato per "${q}"`,
  unknownYear: 'Anno sconosciuto',
  columns: { year: 'Anno', country: 'Paese', director: 'Regista', genre: 'Genere', cast: 'Cast', runtime: 'Durata' },
  yearAfter: 'Il film segreto è uscito dopo',
  yearBefore: 'Il film segreto è uscito prima',
  runtimeLonger: 'Il film segreto dura di più',
  runtimeShorter: 'Il film segreto dura di meno',
  castFull: 'Completo',
  castShared: (names) => `In comune: ${names}`,
  castNone: 'Nessuno',
  attemptPick: (n) => `Tentativo ${n} — seleziona un film qui sopra`,
  attemptLine: (n, year) => `Tentativo ${n}/6 · ${year}`,
  winBadge: 'Vinto!',
  emptyAttempt: '',
  winTitle: (n) => `Vittoria al ${n}° tentativo!`,
  gameOver: 'Game Over',
  winBody: (attempts, points, streak) =>
    `Hai vinto in ${attempts}/6 tentativi con ${points} punti e una streak di ${streak}.`,
  loseBody: (n) => `Il film di oggi resta un mistero. Nessuno spoiler: torna domani per il puzzle #${n}!`,
  share: 'Condividi',
  copy: 'Copia',
  copied: 'Copiato!',
  nextFilm: 'Prossimo film in',
  shareStreak: (n) => `🔥 Streak: ${n} giorni`,
  shareCta: (site) => `Riesci a fare di meglio? Gioca su ${site}`,
  played: 'Giocate',
  won: 'Vinte',
  streak: 'Streak',
  max: 'Max',
  winRate: 'Percentuale vittorie',
  distribution: 'Distribuzione tentativi',
  pointsRule: 'Punti per vittoria: (7 − tentativi) × 100 + streak × 10',
  lbEmpty: 'Nessun punteggio ancora. Vinci una partita per entrare in classifica.',
  lbSetup: 'La classifica non è ancora attiva: le tabelle necessarie non esistono nel database.',
  lbSetupHint: 'Apri il progetto nella dashboard Supabase → SQL Editor ed esegui supabase/schema.sql.',
  lbUnavailable: 'La classifica globale è disponibile solo quando Supabase è configurato.',
  winsCount: (n) => `${n} vittorie`,
  points: 'punti',
  you: '(tu)',
  prevPage: 'Pagina precedente',
  nextPage: 'Pagina successiva',
  player: 'Giocatore',
  authTitle: 'Account e salvataggio cloud',
  guestOnly: 'Attualmente usi la modalità Guest: il progresso è salvato solo su questo dispositivo.',
  guestSetup:
    'Per attivare account e sincronizzazione cloud (email + password), configura un progetto Supabase con il provider Email abilitato e imposta NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
  accountLinked: 'Account collegato',
  synced: 'Salvataggio sincronizzato con il cloud ✓',
  signOutAccount: "Esci dall'account",
  authIntro:
    'Accedi per sincronizzare statistiche e streak e partecipare alla classifica globale. Puoi continuare a giocare come Guest in qualsiasi momento.',
  register: 'Registrati',
  email: 'Email',
  password: 'Password',
  forgot: 'Password dimenticata?',
  leaderboardName: 'Nome in classifica',
  namePlaceholder: 'Es. Marco',
  passwordMin: 'Almeno 6 caratteri',
  confirmPassword: 'Conferma password',
  repeatPassword: 'Ripeti la password',
  forgotHelp: "Inserisci l'email dell'account: riceverai un link per reimpostare la password.",
  sendReset: 'Invia link di recupero',
  backToSignIn: "Torna all'accesso",
  errEmailPassword: 'Inserisci email e password.',
  errName: 'Scegli un nome da 2 a 24 caratteri, senza usare l’email.',
  errPasswordShort: 'La password deve avere almeno 6 caratteri.',
  errPasswordMatch: 'Le password non coincidono.',
  errEmailRequired: 'Inserisci la tua email.',
  errConfirmEmail: "Controlla la tua email e clicca sul link di conferma per attivare l'account, poi accedi.",
  errResetSent: "Se l'email esiste, ti abbiamo inviato un link per reimpostare la password.",
  errGeneric: 'Qualcosa è andato storto. Riprova.',
  errRateLimit:
    'Troppe email inviate da Supabase. La registrazione non ne manda più: riprova tra un minuto. Il recupero password può richiedere fino a un’ora.',
  errBadLogin: 'Email o password non corretti.',
  errExists: 'Esiste già un account con questa email. Prova ad accedere.',
  errAlreadyTried: 'Hai già provato questo film.',
  errServer: 'Impossibile contattare il server. Ricarica la pagina.',
  errAlreadyPlayed: 'Hai già giocato oggi con questo account.',
  resetTitle: 'Nuova password',
  resetSubtitle: 'Imposta una nuova password per il tuo account.',
  resetIntro: 'Imposta una nuova password per il tuo account.',
  newPassword: 'Nuova password',
  savePassword: 'Salva nuova password',
  passwordUpdated: 'Password aggiornata. Ora puoi accedere con la nuova password.',
  resetMissing: 'Link di recupero mancante o non valido.',
  resetAskAgain: 'Richiedi un nuovo link dalla schermata di accesso.',
  backHome: 'Torna a CineClue',
  supabaseMissing: 'Supabase non configurato.',
  setupTitle: 'TMDb non configurato',
  setupBody: 'CineClue funziona tramite le API di The Movie Database. Per abilitare il gioco:',
  setupStep1: 'Richiedi una chiave gratuita su themoviedb.org/settings/api',
  setupStep2: 'Imposta la variabile TMDB_API_KEY nel file .env.local',
  setupStep3: 'Riavvia il server di sviluppo',
  setupEnv: 'Copia il file .env.local.example → .env.local e inserisci le tue chiavi.',
  adminTitle: 'Pannello CineClue',
  adminPassword: 'Inserisci la password di amministrazione.',
  adminEnter: 'Entra',
  adminSubtitle: 'Classifica, statistiche e calendario dei film.',
  adminAccounts: 'Account',
  adminAnonymous: 'Anonimi',
  adminWins: 'Vittorie',
  adminPoints: 'Punti',
  calendar: 'Calendario',
  calendarHelp: 'Oggi è bloccato. I giorni successivi si possono sostituire cercando un film.',
  today: 'oggi',
  chosen: 'scelto',
  automatic: 'automatico',
  replaceMovie: (date) => `Sostituisci il film del ${date}`,
  searchMovie: 'Cerca un film…',
  restoreAuto: 'Torna alla scelta automatica',
  noScores: 'Nessun punteggio.',
  adminLoadFail: 'Impossibile caricare il pannello.',
  adminDenied: 'Accesso negato.',
  adminSaveFail: 'Modifica non riuscita.',
  language: 'Lingua',
  close: 'Chiudi',
  resetChecking: 'Verifico il link…',
  errInvalidEmail: 'Email non valida.',
  errSignupFailed: 'Registrazione non riuscita.',
  errTmdb: 'TMDb non configurato: imposta la variabile TMDB_API_KEY.',
  errGuess: 'Errore nella valutazione del tentativo.',
  errWrongPassword: 'Password non corretta.',
  errAdminSetup: 'Imposta ADMIN_PASSWORD in .env.local (almeno 8 caratteri) e riavvia il server.',
  errUnauthorized: 'Non autorizzato',
  errInvalidMovie: 'Film non valido',
  errScheduleWindow: 'Puoi modificare solo un giorno successivo, entro 60 giorni.'
};

const en: Messages = {
  metaTitle: 'CineClue - The Movie of the Day',
  metaDescription:
    'Guess the Movie of the Day in 6 tries: a new movie puzzle every day, the same for everyone in the world.',
  loading: 'Loading…',
  projectors: 'The projectors are warming up…',
  puzzleOfDay: (n) => `Daily puzzle #${n}`,
  stats: 'Stats',
  yourStats: 'Your stats',
  leaderboard: 'Global leaderboard',
  signIn: 'Sign in',
  signInTitle: 'Sign in with an account',
  profile: 'Profile',
  signOut: 'Sign out',
  account: 'Account',
  guessTitle: 'Movie of the Day',
  guessHeadingBefore: 'Guess the ',
  guessHeadingAfter: '',
  attemptsLeft: (n) =>
    n === 1
      ? 'You have 1 guess left. The movie is revealed only if you get it: otherwise, come back tomorrow for a new puzzle.'
      : `You have ${n} guesses left. The movie is revealed only if you get it: otherwise, come back tomorrow for a new puzzle.`,
  compareHint: 'Compare year, country, director, genre, cast and runtime to get closer to the secret movie.',
  hint: 'Hint',
  legend: 'Legend',
  legendExact: 'Green = exact match',
  legendPartial: 'Yellow = partial (shared country, genre, or some actors)',
  legendWrong: 'Red = different',
  legendArrows: 'Arrows = the secret movie was released or runs longer or shorter',
  footer: 'CineClue — a new puzzle every day · Movie data © TMDb',
  coffee: 'Buy me a coffee',
  searchPlaceholder: 'Search a movie by title (e.g. Inception)…',
  searchDone: 'Game over: come back tomorrow!',
  searchScoring: 'Checking your guess…',
  searchUnavailable: 'Search is unavailable',
  searchFailed: 'Could not reach the search service.',
  searching: (q) => `Searching “${q}”…`,
  noMovies: (q) => `No movies found for “${q}”`,
  unknownYear: 'Unknown year',
  columns: { year: 'Year', country: 'Country', director: 'Director', genre: 'Genre', cast: 'Cast', runtime: 'Runtime' },
  yearAfter: 'The secret movie was released later',
  yearBefore: 'The secret movie was released earlier',
  runtimeLonger: 'The secret movie is longer',
  runtimeShorter: 'The secret movie is shorter',
  castFull: 'Full match',
  castShared: (names) => `In common: ${names}`,
  castNone: 'None',
  attemptPick: (n) => `Guess ${n} — pick a movie above`,
  attemptLine: (n, year) => `Guess ${n}/6 · ${year}`,
  winBadge: 'Won!',
  emptyAttempt: '',
  winTitle: (n) => `Won on guess ${n}!`,
  gameOver: 'Game over',
  winBody: (attempts, points, streak) =>
    `You won in ${attempts}/6 guesses with ${points} points and a streak of ${streak}.`,
  loseBody: (n) => `Today’s movie stays a mystery. No spoilers: come back tomorrow for puzzle #${n}!`,
  share: 'Share',
  copy: 'Copy',
  copied: 'Copied!',
  nextFilm: 'Next movie in',
  shareStreak: (n) => `🔥 Streak: ${n} days`,
  shareCta: (site) => `Can you do better? Play at ${site}`,
  played: 'Played',
  won: 'Won',
  streak: 'Streak',
  max: 'Max',
  winRate: 'Win rate',
  distribution: 'Guess distribution',
  pointsRule: 'Points per win: (7 − guesses) × 100 + streak × 10',
  lbEmpty: 'No scores yet. Win a game to join the leaderboard.',
  lbSetup: 'The leaderboard is not active yet: the required tables are missing.',
  lbSetupHint: 'Open the Supabase project → SQL Editor and run supabase/schema.sql.',
  lbUnavailable: 'The global leaderboard is available only when Supabase is configured.',
  winsCount: (n) => `${n} wins`,
  points: 'points',
  you: '(you)',
  prevPage: 'Previous page',
  nextPage: 'Next page',
  player: 'Player',
  authTitle: 'Account and cloud save',
  guestOnly: 'You are playing as a guest: progress is saved only on this device.',
  guestSetup:
    'To enable accounts and cloud sync (email + password), set up a Supabase project with the Email provider and the NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY variables.',
  accountLinked: 'Signed-in account',
  synced: 'Saved and synced to the cloud ✓',
  signOutAccount: 'Sign out',
  authIntro:
    'Sign in to sync your stats and streak and join the global leaderboard. You can keep playing as a guest at any time.',
  register: 'Sign up',
  email: 'Email',
  password: 'Password',
  forgot: 'Forgot password?',
  leaderboardName: 'Leaderboard name',
  namePlaceholder: 'e.g. Marco',
  passwordMin: 'At least 6 characters',
  confirmPassword: 'Confirm password',
  repeatPassword: 'Repeat the password',
  forgotHelp: 'Enter the account email. You will receive a link to reset the password.',
  sendReset: 'Send reset link',
  backToSignIn: 'Back to sign in',
  errEmailPassword: 'Enter email and password.',
  errName: 'Choose a name of 2 to 24 characters, without using your email.',
  errPasswordShort: 'The password must be at least 6 characters.',
  errPasswordMatch: 'The passwords do not match.',
  errEmailRequired: 'Enter your email.',
  errConfirmEmail: 'Check your email and open the confirmation link, then sign in.',
  errResetSent: 'If that email exists, we sent a link to reset the password.',
  errGeneric: 'Something went wrong. Try again.',
  errRateLimit:
    'Supabase has sent too many emails. Sign-up does not send any more: try again in a minute. Password recovery can take up to an hour.',
  errBadLogin: 'Incorrect email or password.',
  errExists: 'An account with this email already exists. Try signing in.',
  errAlreadyTried: 'You already tried this movie.',
  errServer: 'Could not reach the server. Reload the page.',
  errAlreadyPlayed: 'This account has already played today.',
  resetTitle: 'New password',
  resetSubtitle: 'Set a new password for your account.',
  resetIntro: 'Set a new password for your account.',
  newPassword: 'New password',
  savePassword: 'Save new password',
  passwordUpdated: 'Password updated. You can now sign in with the new password.',
  resetMissing: 'Recovery link missing or invalid.',
  resetAskAgain: 'Request a new link from the sign-in screen.',
  backHome: 'Back to CineClue',
  supabaseMissing: 'Supabase is not configured.',
  setupTitle: 'TMDb is not configured',
  setupBody: 'CineClue uses The Movie Database API. To enable the game:',
  setupStep1: 'Request a free key at themoviedb.org/settings/api',
  setupStep2: 'Set the TMDB_API_KEY variable in .env.local',
  setupStep3: 'Restart the development server',
  setupEnv: 'Copy .env.local.example → .env.local and add your keys.',
  adminTitle: 'CineClue admin',
  adminPassword: 'Enter the admin password.',
  adminEnter: 'Enter',
  adminSubtitle: 'Leaderboard, stats and the movie calendar.',
  adminAccounts: 'Accounts',
  adminAnonymous: 'Anonymous',
  adminWins: 'Wins',
  adminPoints: 'Points',
  calendar: 'Calendar',
  calendarHelp: 'Today is locked. Later days can be replaced by searching for a movie.',
  today: 'today',
  chosen: 'picked',
  automatic: 'automatic',
  replaceMovie: (date) => `Replace the movie for ${date}`,
  searchMovie: 'Search for a movie…',
  restoreAuto: 'Restore the automatic pick',
  noScores: 'No scores.',
  adminLoadFail: 'Could not load the admin panel.',
  adminDenied: 'Access denied.',
  adminSaveFail: 'Could not save the change.',
  language: 'Language',
  close: 'Close',
  resetChecking: 'Checking the link…',
  errInvalidEmail: 'Invalid email.',
  errSignupFailed: 'Sign-up failed.',
  errTmdb: 'TMDb is not configured: set the TMDB_API_KEY variable.',
  errGuess: 'Could not score that guess.',
  errWrongPassword: 'Incorrect password.',
  errAdminSetup: 'Set ADMIN_PASSWORD in .env.local (at least 8 characters) and restart the server.',
  errUnauthorized: 'Not authorized',
  errInvalidMovie: 'Invalid movie',
  errScheduleWindow: 'You can only change a future day, within 60 days.'
};

const messages: Record<Locale, Messages> = { it, en };

interface LocaleValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  m: Messages;
}

const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('it');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'it') setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = messages[locale].metaTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', messages[locale].metaDescription);
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo<LocaleValue>(() => ({ locale, setLocale, m: messages[locale] }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale deve essere usato dentro LocaleProvider');
  return value;
}

export function knownError(message: string, m: Messages): string {
  const exact: Array<[string, string]> = [
    [it.errAlreadyPlayed, m.errAlreadyPlayed],
    [it.errAlreadyTried, m.errAlreadyTried],
    [it.errServer, m.errServer],
    [it.errBadLogin, m.errBadLogin],
    [it.errName, m.errName],
    [it.errPasswordShort, m.errPasswordShort],
    [it.errExists, m.errExists],
    [it.errInvalidEmail, m.errInvalidEmail],
    [it.errSignupFailed, m.errSignupFailed],
    [it.errTmdb, m.errTmdb],
    [it.errGuess, m.errGuess],
    [it.errWrongPassword, m.errWrongPassword],
    [it.errAdminSetup, m.errAdminSetup],
    [it.errUnauthorized, m.errUnauthorized],
    [it.errInvalidMovie, m.errInvalidMovie],
    [it.errScheduleWindow, m.errScheduleWindow],
    [it.supabaseMissing, m.supabaseMissing],
    ['Supabase non configurato', m.supabaseMissing],
    ['Non autenticato', m.errUnauthorized],
    [it.adminDenied, m.adminDenied],
    [it.adminLoadFail, m.adminLoadFail],
    [it.adminSaveFail, m.adminSaveFail]
  ];
  const hit = exact.find(([source]) => source === message);
  if (hit) return hit[1];
  if (/invalid login credentials/i.test(message)) return m.errBadLogin;
  if (/email rate limit exceeded/i.test(message)) return m.errRateLimit;
  if (/already registered|already exists/i.test(message)) return m.errExists;
  return message;
}

function Flag({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 20 14" className="h-3.5 w-5 overflow-hidden rounded-[3px] shadow-sm" aria-hidden="true">
      <title>{label}</title>
      {children}
    </svg>
  );
}

export function LanguageSwitch() {
  const { locale, setLocale, m } = useLocale();
  const button = (code: Locale, title: string, flag: ReactNode) => (
    <button
      type="button"
      onClick={() => setLocale(code)}
      aria-label={title}
      aria-pressed={locale === code}
      title={title}
      className={`rounded-md p-1 transition ${locale === code ? 'bg-white/10 ring-1 ring-white/30' : 'opacity-60 hover:opacity-100'}`}
    >
      {flag}
    </button>
  );

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={m.language}>
      {button(
        'it',
        'Italiano',
        <Flag label="Italiano">
          <rect width="20" height="14" fill="#009246" />
          <rect x="6.7" width="6.6" height="14" fill="#fff" />
          <rect x="13.3" width="6.7" height="14" fill="#ce2b37" />
        </Flag>
      )}
      {button(
        'en',
        'English',
        <Flag label="English">
          <rect width="20" height="14" fill="#012169" />
          <path d="M0 0 L20 14 M20 0 L0 14" stroke="#fff" strokeWidth="2.8" />
          <path d="M0 0 L20 14 M20 0 L0 14" stroke="#C8102E" strokeWidth="1.2" />
          <path d="M10 0 V14 M0 7 H20" stroke="#fff" strokeWidth="4.2" />
          <path d="M10 0 V14 M0 7 H20" stroke="#C8102E" strokeWidth="2.2" />
        </Flag>
      )}
    </div>
  );
}
