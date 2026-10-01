'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { solvedHintCategories } from '@/app/lib/hint';
import type {
  CategoryHint,
  DailyInfo,
  GameState,
  Guess,
  Profile,
  PuzzleDate,
  SubmitGuessResult
} from '@/app/lib/types';
import { MAX_ATTEMPTS } from '@/app/lib/types';
import { puzzleNumber, todayUTC } from '@/app/lib/dates';
import {
  applyResult,
  cleanupOldStates,
  guestId,
  applyServerReset,
  loadGameState,
  loadProfile,
  saveGameState,
  saveProfile
} from '@/app/lib/storage';
import { isSupabaseConfigured, submitDailyScore } from '@/app/lib/supabaseClient';

interface UseGameOptions {
  user: { id: string } | null;
  authReady: boolean;
  syncProfile: () => Promise<void>;
}

interface AccountPlayPayload {
  played?: boolean;
  outcome?: 'playing' | 'won' | 'lost';
  attempts?: number;
  guesses?: Guess[];
  error?: string;
}

export interface UseGame {
  dailyInfo: DailyInfo | null;
  state: GameState | null;
  profile: Profile;
  ready: boolean;
  submitting: boolean;
  error: string | null;
  remaining: number;
  submitGuess: (movieId: number) => Promise<void>;
  dismissError: () => void;
}

export function useGame({ user, authReady, syncProfile }: UseGameOptions): UseGame {
  const [dailyInfo, setDailyInfo] = useState<DailyInfo | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [accountReady, setAccountReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  // Carica metadati del puzzle del giorno.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/daily')
      .then((r) => r.json())
      .then((info: DailyInfo) => {
        if (cancelled) return;
        applyServerReset(info.resetAt);
        setDailyInfo(info);
        cleanupOldStates(info.date);
      })
      .catch(() => {
        if (!cancelled) setError('Impossibile contattare il server. Ricarica la pagina.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Inizializza lo stato della partita quando conosciamo la data e il numero puzzle.
  useEffect(() => {
    if (!dailyInfo || state) return;
    const today = todayUTC();
    const existing = loadGameState(dailyInfo.date);

    const initial: GameState =
      existing && existing.date === dailyInfo.date
        ? existing
        : {
            date: dailyInfo.date,
            puzzleNumber: dailyInfo.puzzleNumber,
            status: 'playing',
            guesses: [],
            wonAtAttempt: null
          };

    // Se era rimasta una partita "in corso" di un giorno SCADUTO, la scartiamo.
    const effective: GameState =
      initial.date === today ? initial : freshState(dailyInfo.date, dailyInfo.puzzleNumber);

    saveGameState(effective);
    setState(effective);
  }, [dailyInfo, state]);

  // L'account può aver già chiuso la partita su un altro browser.
  useEffect(() => {
    if (!authReady || !dailyInfo) return;
    if (!user?.id) {
      setAccountReady(true);
      return;
    }

    let cancelled = false;
    setAccountReady(false);
    fetch(`/api/account/today?date=${encodeURIComponent(dailyInfo.date)}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as AccountPlayPayload;
      })
      .then((payload) => {
        if (cancelled) return;
        setProfile(loadProfile());
        if (payload?.played && payload.outcome) {
          const next = stateFromPlay(dailyInfo.date, dailyInfo.puzzleNumber, payload);
          setState((prev) => {
            if (prev && prev.date === dailyInfo.date && prev.status !== 'playing') return prev;
            if (
              payload.outcome === 'playing' &&
              prev &&
              prev.date === dailyInfo.date &&
              prev.guesses.length >= next.guesses.length
            ) {
              return prev;
            }
            saveGameState(next);
            return next;
          });
        }
        setAccountReady(true);
      })
      .catch(() => {
        if (!cancelled) setAccountReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, user?.id, dailyInfo]);

  const dismissError = useCallback(() => setError(null), []);

  // Dal 4° tentativo in poi: una categoria ancora non indovinata, bloccata sui primi 3 tentativi.
  useEffect(() => {
    if (!state || state.hint || state.status !== 'playing' || state.guesses.length < 3) return;

    let cancelled = false;
    const solved = solvedHintCategories(state.guesses);
    fetch('/api/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: state.date, solved })
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const payload = (await res.json()) as { hint?: CategoryHint | null };
        return payload.hint ?? null;
      })
      .then((hint) => {
        if (cancelled || !hint) return;
        setState((prev) => {
          if (!prev || prev.hint || prev.date !== state.date) return prev;
          const next = { ...prev, hint };
          saveGameState(next);
          return next;
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [state]);

  const submitGuess = useCallback(
    async (movieId: number) => {
      if (!state || state.status !== 'playing' || !accountReady) return;
      if (submittingRef.current) return;
      if (state.guesses.some((g) => g.id === movieId)) {
        setError('Hai già provato questo film.');
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch('/api/guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId, date: state.date })
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as AccountPlayPayload | null;
          if (res.status === 409 && payload?.played && payload.outcome && payload.outcome !== 'playing') {
            const next = stateFromPlay(state.date, state.puzzleNumber, payload);
            saveGameState(next);
            setState(next);
            return;
          }
          throw new Error(payload?.error ?? 'Errore nella valutazione del tentativo.');
        }

        const data = (await res.json()) as SubmitGuessResult;
        const attempts = state.guesses.length + 1;
        const guess: Guess = {
          id: data.movie.id,
          title: data.movie.title,
          year: data.movie.year,
          posterPath: data.movie.posterPath,
          feedback: data.feedback
        };

        const won = data.won;
        const nextStatus = won ? 'won' : attempts >= MAX_ATTEMPTS ? 'lost' : 'playing';

        const nextState: GameState = {
          ...state,
          status: nextStatus,
          guesses: [...state.guesses, guess],
          wonAtAttempt: won ? attempts : null
        };
        saveGameState(nextState);
        setState(nextState);

        // Aggiorna statistiche & streak.
        const nextProfile = applyResult(profile, {
          won,
          attempts: won ? attempts : null,
          date: state.date,
          points: 0
        });
        if (isSupabaseConfigured() && user) {
          submitDailyScore({
            date: state.date,
            puzzleNumber: state.puzzleNumber,
            attempts,
            won: nextStatus === 'won',
            outcome: nextStatus,
            guesses: nextState.guesses
          }).catch(() => undefined);
          if (nextStatus !== 'playing') syncProfile().catch(() => undefined);
        } else if (isSupabaseConfigured() && won) {
          submitDailyScore({
            date: state.date,
            puzzleNumber: state.puzzleNumber,
            attempts,
            won: true,
            guestId: guestId()
          }).catch(() => undefined);
        }
        saveProfile(nextProfile);
        setProfile(nextProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Qualcosa è andato storto. Riprova.');
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [state, profile, user, syncProfile, accountReady]
  );

  return {
    dailyInfo,
    state,
    profile,
    ready: !!state && accountReady,
    submitting,
    error,
    remaining: state ? MAX_ATTEMPTS - state.guesses.length : MAX_ATTEMPTS,
    submitGuess,
    dismissError
  };
}

function stateFromPlay(date: PuzzleDate, puzzleNumber: number, play: AccountPlayPayload): GameState {
  const status = play.outcome === 'won' ? 'won' : play.outcome === 'lost' ? 'lost' : 'playing';
  const attempts = Number(play.attempts);
  return {
    date,
    puzzleNumber,
    status,
    guesses: Array.isArray(play.guesses) ? play.guesses : [],
    wonAtAttempt: status === 'won' && Number.isInteger(attempts) ? attempts : null
  };
}

function freshState(date: PuzzleDate, number: number): GameState {
  return {
    date,
    puzzleNumber: number,
    status: 'playing',
    guesses: [],
    wonAtAttempt: null
  };
}

export { puzzleNumber, todayUTC };