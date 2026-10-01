'use client';

import { useMemo, useState } from 'react';
import { Clapperboard } from 'lucide-react';

import { useAuth } from '@/app/hooks/useAuth';
import { useGame } from '@/app/hooks/useGame';
import { pointsForWin } from '@/app/lib/storage';
import { isSupabaseConfigured } from '@/app/lib/supabaseClient';

import Header from './Header';
import SearchInput from './SearchInput';
import GuessGrid from './GuessGrid';
import GameOverPanel from './GameOverPanel';
import StatsModal from './StatsModal';
import LeaderboardModal from './LeaderboardModal';
import AuthModal from './AuthModal';
import SetupBanner from './SetupBanner';
import Toast from './Toast';

export default function Game() {
  const auth = useAuth();
  const game = useGame({
    user: auth.user ? { id: auth.user.id } : null,
    authReady: !auth.loading,
    syncProfile: auth.syncProfile
  });

  const [statsOpen, setStatsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

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
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Clapperboard className="h-10 w-10 animate-pulse text-cinema-accent" />
          <p className="text-sm">Si accendono i proiettori…</p>
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
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        user={auth.user ? { name: auth.user.name, email: auth.user.email } : null}
        authConfigured={isSupabaseConfigured()}
        onSignOut={() => auth.signOut()}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6">
        {/* Intestazione puzzle */}
        <div className="mb-5 text-center">
          <h2 className="font-display text-3xl font-black text-white">
            Indovina il <span className="text-cinema-accent">Film del Giorno</span>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Hai <strong className="text-white">{remaining}</strong>{' '}
            tentativ{remaining === 1 ? 'o' : 'i'} a disposizione. Il film si rivela solo se lo
            indovini: altrimenti, torna domani per un nuovo puzzle.
          </p>
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
                💡 Confronta anno, paese, regista, genere, cast e durata per avvicinarti al film segreto.
              </p>
            )}
          </div>
        )}

        {state?.hint ? (
          <p className="mx-auto mb-6 max-w-xl rounded-xl border border-cinema-gold/30 bg-cinema-gold/10 px-3 py-2 text-center text-sm text-cinema-gold">
            Suggerimento: <span className="font-semibold text-white">{state.hint.label}</span> — {state.hint.value}
          </p>
        ) : null}

        {gameOver && state ? (
          <div className="mx-auto mb-6 max-w-xl">
            <GameOverPanel state={state} profile={profile} outcome={outcome} />
          </div>
        ) : null}

        {/* Griglia tentativi */}
        {state ? <GuessGrid state={state} /> : null}

        {/* Legenda */}
        {!gameOver && (
          <div className="mt-8 rounded-2xl border border-cinema-line bg-white/[0.02] p-4 text-xs text-slate-400">
            <p className="mb-2 font-bold uppercase tracking-widest text-slate-500">Legenda</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              <li>🟩 Colonna verde = dato esatto</li>
              <li>🟨 Giallo = parziale (paese, genere in comune o qualche attore)</li>
              <li>🟥 Rosso = dato diverso</li>
              <li>⬆️⬇️ Frecce = il film segreto è uscito/dura di più o di meno</li>
            </ul>
          </div>
        )}

        {/* Footer */}
        <p className="mt-10 text-center text-[11px] text-slate-600">
          🎬 CineClue — un nuovo puzzle ogni giorno · Dati film © TMDb
        </p>
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

      <Toast message={error ?? ''} onDismiss={dismissError} />
    </div>
  );
}