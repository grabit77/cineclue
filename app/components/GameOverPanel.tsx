'use client';

import { useState } from 'react';
import { Check, Copy, Facebook, Flame, Share2, Trophy } from 'lucide-react';

import type { GameState, Profile } from '@/app/lib/types';
import { MAX_ATTEMPTS } from '@/app/lib/types';
import { buildShareText, copyToClipboard, facebookShareUrl, webShare } from '@/app/lib/share';
import { pointsForWin } from '@/app/lib/storage';
import Countdown from './Countdown';
import { Spinner } from './ui';

interface GameOverPanelProps {
  state: GameState;
  profile: Profile;
  outcome: { points: number; newStreak: number } | null;
}

export default function GameOverPanel({ state, profile, outcome }: GameOverPanelProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [fbBusy, setFbBusy] = useState(false);

  const won = state.status === 'won';
  const text = buildShareText(state, profile);
  const nextPuzzle = state.puzzleNumber + 1;

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    const ok = await webShare(text);
    setSharing(false);
    if (!ok) {
      // Web Share non disponibile: caduta sul clipboard.
      await handleCopy();
    }
  };

  const handleFacebook = async () => {
    setFbBusy(true);
    const url = facebookShareUrl(text);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'CineClue', text, url });
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setFbBusy(false);
    }
  };

  return (
    <div className={`animate-pop rounded-2xl border p-5 shadow-card ${
      won ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : 'border-cinema-line bg-cinema-surface'
    }`}>
      <div className="mb-1 flex items-center gap-2">
        {won ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Trophy className="h-4 w-4" />
          </span>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cinema-accent/20 text-cinema-accent">
            <Flame className="h-4 w-4" />
          </span>
        )}
        <h3 className="font-display text-xl font-bold text-white">
          {won ? `Vittoria al ${state.wonAtAttempt}° tentativo!` : 'Game Over'}
        </h3>
      </div>

      <p className="mb-4 text-sm text-slate-300">
        {won ? (
          <>
            Hai vinto in {state.wonAtAttempt}/{MAX_ATTEMPTS} tentativi con{' '}
            <span className="font-semibold text-emerald-400">{outcome?.points ?? 0} punti</span> e
            una streak di <span className="font-semibold text-orange-400">{outcome?.newStreak ?? profile.currentStreak}</span>.
          </>
        ) : (
          <>
            Il film di oggi resta un mistero. 💀 Nessuno spoiler: torna domani per il puzzle{' '}
            <span className="font-semibold text-white">#{nextPuzzle}</span>!
          </>
        )}
      </p>

      {/* Anteprima griglia condivisa */}
      <div className="mb-4 rounded-xl border border-cinema-line/70 bg-black/20 p-3">
        <pre className="whitespace-pre-wrap text-center font-mono text-[11px] leading-relaxed text-slate-300">
          {text}
        </pre>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Countdown />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          onClick={handleShare}
          disabled={sharing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cinema-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c00812] disabled:opacity-60"
        >
          <Share2 className="h-4 w-4" />
          {sharing ? <Spinner className="h-4 w-4" /> : 'Condividi'}
        </button>
        <button
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cinema-line bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiato!' : 'Copia'}
        </button>
        <button
          onClick={handleFacebook}
          disabled={fbBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#166FE5] disabled:opacity-60"
        >
          {fbBusy ? <Spinner className="h-4 w-4" /> : <Facebook className="h-4 w-4" />}
          Facebook
        </button>
      </div>
    </div>
  );
}