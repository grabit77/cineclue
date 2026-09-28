'use client';

import { MAX_ATTEMPTS } from './types';
import type { GameState, Profile } from './types';

/**
 * Costruisce il testo di condivisione (senza spoiler: niente titoli,
 * niente nomi di attori/registi — solo la griglia di emoji).
 */

function feedbackEmojis(state: GameState): string {
  return state.guesses
    .map((g) => {
      const f = g.feedback;
      const year = f.year.status === 'exact' ? '🟩' : f.year.status === 'up' ? '⬆️' : '⬇️';
      const country =
        f.country?.status === 'match' ? '🟩' : f.country?.status === 'partial' ? '🟨' : '🟥';
      const director = f.director.status === 'match' ? '🟩' : '🟥';
      const genre = f.genre.status === 'match' ? '🟩' : f.genre.status === 'partial' ? '🟨' : '🟥';
      const cast = f.cast.status === 'match' ? '🟩' : f.cast.status === 'partial' ? '🟨' : '🟥';
      const runtime = f.runtime.status === 'exact' ? '🟩' : f.runtime.status === 'up' ? '⬆️' : '⬇️';
      return [year, country, director, genre, cast, runtime].join(' ');
    })
    .join('\n');
}

export function buildShareText(state: GameState, profile: Profile): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://cineclue.com';

  const header =
    state.status === 'won'
      ? `CineClue #${state.puzzleNumber} 🎬 ${state.wonAtAttempt}/${MAX_ATTEMPTS}`
      : `CineClue #${state.puzzleNumber} 🎬 X/${MAX_ATTEMPTS}`;

  const streakLine = profile.currentStreak > 0 ? `🔥 Streak: ${profile.currentStreak} giorni` : null;
  const grid = feedbackEmojis(state);

  return [header, streakLine, '', grid, '', `Riesci a fare di meglio? Gioca su ${site}`]
    .filter((l) => l !== null)
    .join('\n');
}

export function facebookShareUrl(text: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://cineclue.com';
  const params = new URLSearchParams({ u: site, quote: text });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback per contesti non sicuri (http locali).
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export async function webShare(text: string): Promise<boolean> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://cineclue.com';
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'CineClue', text, url: site });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}