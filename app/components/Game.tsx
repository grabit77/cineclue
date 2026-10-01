'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clapperboard, Coffee } from 'lucide-react';

import { useAuth } from '@/app/hooks/useAuth';
import { useEndless } from '@/app/hooks/useEndless';
import { useGame } from '@/app/hooks/useGame';
import { pointsForWin } from '@/app/lib/storage';
import { isSupabaseConfigured } from '@/app/lib/supabaseClient';
import { useLocale } from '@/app/lib/i18n';
import type { GameState } from '@/app/lib/types';

import Header from './Header';
import SearchInput from './SearchInput';
import GuessGrid from './GuessGrid';
import GameOverPanel from './GameOverPanel';
import EndlessOver from './EndlessOver';
import StatsModal from './StatsModal';
import LeaderboardModal from './LeaderboardModal';
import AuthModal from './AuthModal';
import SetupBanner from './SetupBanner';
import Toast from './Toast';

const MODE_KEY = 'cineclue:mode';

export default function Game() {
  const auth = useAuth();
  const { m } = useLocale();
  const game = useGame({
    user: auth.user ? { id: auth.user.id } : null,
    authReady: !auth.loading,
    syncProfile: auth.syncProfile
  });

  const [statsOpen, setStatsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<'daily' | 'endless'>('daily');
  const [modeReady, setModeReady] = useState(false);
  const endless = useEndless(modeReady && mode === 'endless');

  useEffect(() => {
    if (window.localStorage.getItem(MODE_KEY) === 'endless') setMode('endless');
    setModeReady(true);
  }, []);

  const selectMode = (next: 'daily' | 'endless') => {
    setMode(next);
    window.localStorage.setItem(MODE_KEY, next);
  };

  const { dailyInfo, state, profile, ready, submitting, error, remaining, submitGuess, dismissError } = game;

  const outcome = useMemo(() => {
    if (!state || state.status !== 'won' || !state.wonAtAttempt) return null;
    return {
      points: pointsForWin(state.wonAtAttempt, profile.currentStreak),
      newStreak: profile.currentStreak
    };
  }, [state, profile]);

  const gameOver = ready && state !== null && state.status !== 'playing';
  const suggestHint =
    ready && state !== null && state.status === 'playing' && state.guesses.length === 1;

  // Attende il metadato del puzzle prima di disegnare qualsiasi cosa.
  const endlessState = endless.state;
  const endlessGrid: GameState | null = endlessState
    ? {
        date: '1970-01-01',
        puzzleNumber: 0,
        status: endlessState.status,
        guesses: endlessState.guesses,
        wonAtAttempt: endlessState.wonAtAttempt,
        hint: endlessState.hint
      }
    : null;
  const endlessOver = endlessState !== null && endlessState.status !== 'playing';

  if (!modeReady || (mode === 'daily' && !ready) || (mode === 'endless' && !endless.ready)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Clapperboard className="h-10 w-10 animate-pulse text-cinema-accent" />
          <p className="text-sm">{m.projectors}</p>
        </div>
      </div>
    );
  }

  if (dailyInfo && !dailyInfo.tmdbConfigured) {
    return <SetupBanner />;
  }

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <Header
        puzzleNumber={state?.puzzleNumber ?? null}
        kicker={mode === 'endless' ? m.endlessMode : null}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        user={auth.user ? { name: auth.user.name, email: auth.user.email } : null}
        authConfigured={isSupabaseConfigured()}
        onSignOut={() => auth.signOut()}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6">
        <div className="mb-5 flex justify-center">
          <div className="inline-flex rounded-xl border border-cinema-line bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => selectMode('daily')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                mode === 'daily' ? 'bg-cinema-accent text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m.dailyMode}
            </button>
            <button
              type="button"
              onClick={() => selectMode('endless')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                mode === 'endless' ? 'bg-cinema-accent text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m.endlessMode}
            </button>
          </div>
        </div>

        {mode === 'endless' && endlessState && endlessGrid ? (
          <>
            <div className="mb-5 text-center">
              <h2 className="font-display text-3xl font-black text-white">{m.endlessMode}</h2>
              <p className="mt-1 text-sm text-slate-400">
                {endlessOver ? m.endlessNote : m.endlessAttempts(endless.remaining)}
              </p>
            </div>
            {!endlessOver ? (
              <div className="mb-6">
                <SearchInput
                  disabled={false}
                  submitting={endless.submitting}
                  onSelect={(movie) => endless.submitGuess(movie.id)}
                />
              </div>
            ) : (
              <div className="mx-auto mb-6 max-w-xl">
                <EndlessOver state={endlessState} busy={endless.submitting} onAgain={() => void endless.playAgain()} />
              </div>
            )}
            {endlessState.hint && !endlessOver ? (
              <p className="mx-auto mb-6 max-w-xl rounded-xl border border-cinema-gold/30 bg-cinema-gold/10 px-3 py-2 text-center text-sm text-cinema-gold">
                {m.hint}: <span className="font-semibold text-white">{m.columns[endlessState.hint.category]}</span> —{' '}
                {endlessState.hint.value}
              </p>
            ) : null}
            <GuessGrid state={endlessGrid} />
          </>
        ) : mode === 'endless' ? (
          <div className="mb-6 text-center">
            <p className="mb-3 text-sm text-slate-400">{endless.error ?? m.errServer}</p>
            <button
              type="button"
              onClick={() => void endless.playAgain()}
              className="rounded-xl bg-cinema-accent px-4 py-2.5 text-sm font-semibold text-white"
            >
              {m.playAgain}
            </button>
          </div>
        ) : (
          <>
        <div className="mb-5 text-center">
          <h2 className="font-display text-3xl font-black text-white">
            {m.guessHeadingBefore}
            <span className="text-cinema-accent">{m.guessTitle}</span>
            {m.guessHeadingAfter}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{m.attemptsLeft(remaining)}</p>
        </div>

        {/* Input / stato partita */}
        {!gameOver && (
          <div className="mb-6">
            <SearchInput
              disabled={!ready || gameOver}
              submitting={submitting}
              onSelect={(movie) => game.submitGuess(movie.id)}
            />
            {suggestHint && !state?.hint && (
              <p className="mt-2 text-center text-xs text-slate-500">
                💡 {m.compareHint}
              </p>
            )}
          </div>
        )}

        {state?.hint ? (
          <p className="mx-auto mb-6 max-w-xl rounded-xl border border-cinema-gold/30 bg-cinema-gold/10 px-3 py-2 text-center text-sm text-cinema-gold">
            {m.hint}: <span className="font-semibold text-white">{m.columns[state.hint.category]}</span> — {state.hint.value}
          </p>
        ) : null}

        {gameOver && state ? (
          <div className="mx-auto mb-6 max-w-xl">
            <GameOverPanel state={state} profile={profile} outcome={outcome} />
          </div>
        ) : null}

        {state ? <GuessGrid state={state} /> : null}
          </>
        )}

        {(mode === 'daily' ? !gameOver : Boolean(endlessState && !endlessOver)) && (
          <div className="mt-8 rounded-2xl border border-cinema-line bg-white/[0.02] p-4 text-xs text-slate-400">
            <p className="mb-2 font-bold uppercase tracking-widest text-slate-500">{m.legend}</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              <li>🟩 {m.legendExact}</li>
              <li>🟨 {m.legendPartial}</li>
              <li>🟥 {m.legendWrong}</li>
              <li>⬆️⬇️ {m.legendArrows}</li>
            </ul>
          </div>
        )}

        <footer className="mt-10 flex flex-col items-center gap-3">
          <a
            href="https://buymeacoffee.com/grabit77"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#FFDD00] px-4 py-2 text-sm font-bold text-black transition hover:brightness-95"
          >
            <Coffee className="h-4 w-4" />
            {m.coffee}
          </a>
          <p className="text-center text-[11px] text-slate-600">🎬 {m.footer}</p>
        </footer>
      </main>

      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} profile={profile} />
      <LeaderboardModal
        open={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        currentUserId={auth.user?.id ?? null}
      />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />

      <Toast message={(mode === 'endless' ? endless.error : error) ?? ''} onDismiss={mode === 'endless' ? endless.dismissError : dismissError} />
    </div>
  );
}