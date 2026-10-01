'use client';

import type { GameState } from '@/app/lib/types';
import { MAX_ATTEMPTS } from '@/app/lib/types';
import { useLocale } from '@/app/lib/i18n';
import GuessRow from './GuessRow';

export default function GuessGrid({ state }: { state: GameState }) {
  const { m } = useLocale();
  const columns = [m.columns.year, m.columns.country, m.columns.director, m.columns.genre, m.columns.cast, m.columns.runtime];
  const rows = [];
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const guess = state.guesses[i];
    rows.push(
      <GuessRow
        key={guess ? `g-${guess.id}-${i}` : `empty-${i}`}
        index={i}
        guess={guess ?? null}
        lastWon={state.status === 'won' && i === state.guesses.length - 1}
      />
    );
  }

  return (
    <div className="w-full">
      <div className="mb-2 hidden grid-cols-6 gap-2 px-1 sm:grid">
        {columns.map((c) => (
          <div
            key={c}
            className="pb-0 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500"
          >
            {c}
          </div>
        ))}
      </div>
      <div className="space-y-2">{rows}</div>
    </div>
  );
}