'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { solvedHintCategories } from '@/app/lib/hint';
import { knownError, useLocale } from '@/app/lib/i18n';
import type { CategoryHint, GameStatus, Guess, GuessFeedback } from '@/app/lib/types';
import { MAX_ATTEMPTS } from '@/app/lib/types';

const STORAGE_KEY = 'cineclue:endless';

export interface RevealedMovie {
  id: number;
  title: string;
  year: number | null;
  posterPath: string | null;
}

export interface EndlessState {
  token: string;
  status: GameStatus;
  guesses: Guess[];
  wonAtAttempt: number | null;
  hint?: CategoryHint | null;
  reveal: RevealedMovie | null;
}

interface GuessPayload {
  token?: string;
  won?: boolean;
  done?: boolean;
  movie?: RevealedMovie;
  feedback?: GuessFeedback;
  reveal?: RevealedMovie | null;
  error?: string;
}

function readSaved(): EndlessState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as EndlessState;
    if (!data || typeof data.token !== 'string' || !Array.isArray(data.guesses)) return null;
    if (data.status !== 'playing' && data.status !== 'won' && data.status !== 'lost') return null;
    return data;
  } catch {
    return null;
  }
}

function writeSaved(state: EndlessState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function requestRound(): Promise<EndlessState> {
  const res = await fetch('/api/endless/start', { method: 'POST' });
  const payload = (await res.json().catch(() => null)) as { token?: string; error?: string } | null;
  if (!res.ok || !payload?.token) {
    throw new Error(payload?.error ?? 'start');
  }
  return {
    token: payload.token,
    status: 'playing',
    guesses: [],
    wonAtAttempt: null,
    hint: null,
    reveal: null
  };
}

export function useEndless(active: boolean) {
  const { locale, m } = useLocale();
  const messages = useRef(m);
  messages.current = m;
  const [state, setState] = useState<EndlessState | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    const saved = readSaved();
    if (saved) {
      setState(saved);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    requestRound()
      .then((next) => {
        if (cancelled) return;
        writeSaved(next);
        setState(next);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setError(messages.current.errServer);
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!active || !state || state.hint || state.status !== 'playing' || state.guesses.length < 3) return;

    let cancelled = false;
    const solved = solvedHintCategories(state.guesses);
    fetch('/api/endless/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: state.token, solved, lang: locale })
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const payload = (await res.json()) as { hint?: CategoryHint | null };
        return payload.hint ?? null;
      })
      .then((hint) => {
        if (cancelled || !hint) return;
        setState((prev) => {
          if (!prev || prev.hint || prev.token !== state.token) return prev;
          const next = { ...prev, hint };
          writeSaved(next);
          return next;
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [active, state, locale]);

  const playAgain = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const next = await requestRound();
      writeSaved(next);
      setState(next);
    } catch (err) {
      setError(err instanceof Error ? knownError(err.message, m) : m.errServer);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [m]);

  const submitGuess = useCallback(
    async (movieId: number) => {
      if (!state || state.status !== 'playing') return;
      if (submittingRef.current) return;
      if (state.guesses.some((guess) => guess.id === movieId)) {
        setError(m.errAlreadyTried);
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch('/api/endless/guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: state.token, movieId, lang: locale })
        });
        const payload = (await res.json().catch(() => null)) as GuessPayload | null;
        if (!res.ok || !payload?.movie || !payload.feedback || !payload.token) {
          throw new Error(payload?.error ?? m.errGuess);
        }

        const attempts = state.guesses.length + 1;
        const won = payload.won === true;
        const next: EndlessState = {
          token: payload.token,
          status: won ? 'won' : attempts >= MAX_ATTEMPTS ? 'lost' : 'playing',
          guesses: [
            ...state.guesses,
            {
              id: payload.movie.id,
              title: payload.movie.title,
              year: payload.movie.year,
              posterPath: payload.movie.posterPath,
              feedback: payload.feedback
            }
          ],
          wonAtAttempt: won ? attempts : null,
          hint: state.hint ?? null,
          reveal: payload.reveal ?? null
        };
        writeSaved(next);
        setState(next);
      } catch (err) {
        setError(err instanceof Error ? knownError(err.message, m) : m.errGeneric);
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [state, locale, m]
  );

  return {
    state,
    ready,
    submitting,
    error,
    remaining: state ? MAX_ATTEMPTS - state.guesses.length : MAX_ATTEMPTS,
    submitGuess,
    playAgain,
    dismissError: () => setError(null)
  };
}
