'use client';

import { ArrowDown, ArrowUp, Check, X } from 'lucide-react';

import type { Guess } from '@/app/lib/types';

const MAX_SHARED_NAMES = 3;

function posterUrl(path: string | null): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w92${path}`;
}

/* ---- Utilità di stile celle ---- */
const cellBase = 'rounded-xl px-1.5 py-2 text-center sm:px-2 flex flex-col items-center justify-center gap-0.5 min-h-[3.4rem] sm:min-h-[4rem]';

function cellClass(variant: 'green' | 'yellow' | 'red' | 'neutral'): string {
  switch (variant) {
    case 'green':
      return `${cellBase} bg-emerald-500/90 text-white`;
    case 'yellow':
      return `${cellBase} bg-yellow-400 text-black`;
    case 'red':
      return `${cellBase} bg-cinema-accent/90 text-white`;
    case 'neutral':
    default:
      return `${cellBase} border border-cinema-line bg-white/[0.03] text-slate-300`;
  }
}

function CellLabel({ children }: { children: string }) {
  return <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">{children}</span>;
}

function YearCell({ feedback }: { feedback: Guess['feedback']['year'] }) {
  if (feedback.status === 'exact') {
    return (
      <div className={cellClass('green')}>
        <CellLabel>Anno</CellLabel>
        <span className="text-sm font-bold leading-none sm:text-base">{feedback.value}</span>
      </div>
    );
  }
  const up = feedback.status === 'up';
  const Arrow = up ? ArrowUp : ArrowDown;
  const title = up ? 'Il film segreto è uscito dopo' : 'Il film segreto è uscito prima';
  return (
    <div className={cellClass('neutral')} title={title}>
      <CellLabel>Anno</CellLabel>
      <span className="flex items-center gap-1 text-sm font-bold leading-none sm:text-base">
        <Arrow className="h-3.5 w-3.5" />
        {feedback.value}
      </span>
    </div>
  );
}

function CountryCell({ feedback }: { feedback: Guess['feedback']['country'] | undefined }) {
  if (!feedback) {
    return (
      <div className={cellClass('neutral')}>
        <CellLabel>Paese</CellLabel>
        <span className="text-[10px] font-semibold leading-tight sm:text-xs">—</span>
      </div>
    );
  }
  const variant = feedback.status === 'match' ? 'green' : feedback.status === 'partial' ? 'yellow' : 'red';
  return (
    <div className={cellClass(variant)} title={feedback.name ?? undefined}>
      <CellLabel>Paese</CellLabel>
      <span className="line-clamp-2 text-[10px] font-semibold leading-tight sm:text-xs">
        {feedback.name ?? '—'}
      </span>
    </div>
  );
}

function DirectorCell({ feedback }: { feedback: Guess['feedback']['director'] }) {
  const match = feedback.status === 'match';
  return (
    <div className={cellClass(match ? 'green' : 'red')} title={feedback.name ?? undefined}>
      <CellLabel>Regista</CellLabel>
      <span className="line-clamp-2 text-[10px] font-semibold leading-tight sm:text-xs">
        {feedback.name ?? '—'}
      </span>
    </div>
  );
}

function GenreCell({ feedback }: { feedback: Guess['feedback']['genre'] }) {
  const variant = feedback.status === 'match' ? 'green' : feedback.status === 'partial' ? 'yellow' : 'red';
  return (
    <div className={cellClass(variant)} title={feedback.name ?? undefined}>
      <CellLabel>Genere</CellLabel>
      <span className="line-clamp-2 text-[10px] font-semibold leading-tight sm:text-xs">
        {feedback.name ?? '—'}
      </span>
    </div>
  );
}

function CastCell({ feedback }: { feedback: Guess['feedback']['cast'] }) {
  if (feedback.status === 'match') {
    return (
      <div className={cellClass('green')}>
        <CellLabel>Cast</CellLabel>
        <span className="flex items-center gap-1 text-[10px] font-semibold sm:text-xs">
          <Check className="h-3 w-3" /> Completo
        </span>
      </div>
    );
  }
  if (feedback.status === 'partial') {
    const visible = feedback.shared.slice(0, MAX_SHARED_NAMES);
    const extra = feedback.shared.length - visible.length;
    const names = visible.join(', ') + (extra > 0 ? ` +${extra}` : '');
    return (
      <div className={cellClass('yellow')}>
        <CellLabel>Cast</CellLabel>
        <p className="line-clamp-3 text-[9px] font-semibold leading-tight sm:text-[10px]">
          In comune: {names}
        </p>
      </div>
    );
  }
  return (
    <div className={cellClass('red')}>
      <CellLabel>Cast</CellLabel>
      <span className="flex items-center gap-1 text-[10px] font-semibold sm:text-xs">
        <X className="h-3 w-3" /> Nessuno
      </span>
    </div>
  );
}

function RuntimeCell({ feedback }: { feedback: Guess['feedback']['runtime'] }) {
  if (feedback.status === 'exact') {
    return (
      <div className={cellClass('green')}>
        <CellLabel>Durata</CellLabel>
        <span className="text-sm font-bold leading-none sm:text-base">
          {feedback.value}
          <span className="text-[10px]">′</span>
        </span>
      </div>
    );
  }
  const up = feedback.status === 'up';
  const Arrow = up ? ArrowUp : ArrowDown;
  const title = up ? 'Il film segreto dura di più' : 'Il film segreto dura di meno';
  return (
    <div className={cellClass('neutral')} title={title}>
      <CellLabel>Durata</CellLabel>
      <span className="flex items-center gap-0.5 text-sm font-bold leading-none sm:text-base">
        <Arrow className="h-3.5 w-3.5" />
        {feedback.value}
        <span className="text-[10px]">′</span>
      </span>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-cinema-line/70 bg-white/[0.015] px-3 py-2">
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cellClass('neutral')}>
            <span className="text-[10px] text-slate-600">
              {['Anno', 'Paese', 'Regista', 'Genere', 'Cast', 'Durata'][i]}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-center text-[10px] text-slate-600">{label}</p>
    </div>
  );
}

interface GuessRowProps {
  index: number;
  guess: Guess | null;
  lastWon?: boolean;
}

export default function GuessRow({ index, guess, lastWon }: GuessRowProps) {
  if (!guess) {
    return (
      <EmptyRow label={index === 0 ? `Tentativo ${index + 1} — seleziona un film qui sopra` : ''} />
    );
  }

  return (
    <div
      className={`animate-row-in rounded-2xl border bg-cinema-surface px-3 py-2.5 shadow-card ${
        lastWon ? 'border-emerald-500/70 ring-1 ring-emerald-500/30' : 'border-cinema-line'
      }`}
    >
      {/* Chip del film indovinato */}
      <div className="mb-2 flex items-center gap-2.5">
        {posterUrl(guess.posterPath) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl(guess.posterPath)!}
            alt=""
            className="h-11 w-8 shrink-0 rounded-md object-cover"
          />
        ) : (
          <span className="flex h-11 w-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-[9px] text-slate-500">
            N/A
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{guess.title}</p>
          <p className="text-[11px] text-slate-400">
            Tentativo {index + 1}/6 · {guess.year ?? 'anno  sconosciuto'}
          </p>
        </div>
        {lastWon ? (
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
            Win!
          </span>
        ) : null}
      </div>

      {/* Griglia feedback */}
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        <YearCell feedback={guess.feedback.year} />
        <CountryCell feedback={guess.feedback.country} />
        <DirectorCell feedback={guess.feedback.director} />
        <GenreCell feedback={guess.feedback.genre} />
        <CastCell feedback={guess.feedback.cast} />
        <RuntimeCell feedback={guess.feedback.runtime} />
      </div>
    </div>
  );
}