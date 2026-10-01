'use client';

import { useLocale } from '@/app/lib/i18n';
import type { EndlessState } from '@/app/hooks/useEndless';

function posterUrl(path: string | null): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w185${path}`;
}

export default function EndlessOver({
  state,
  busy,
  onAgain
}: {
  state: EndlessState;
  busy: boolean;
  onAgain: () => void;
}) {
  const { m } = useLocale();
  const won = state.status === 'won';
  const movie = state.reveal;
  const poster = posterUrl(movie?.posterPath ?? null);

  return (
    <div
      className={`animate-pop rounded-2xl border p-5 shadow-card ${
        won ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : 'border-cinema-line bg-cinema-surface'
      }`}
    >
      <h3 className="font-display text-xl font-bold text-white">
        {won ? m.winTitle(state.wonAtAttempt ?? 0) : m.gameOver}
      </h3>
      <p className="mt-1 text-sm text-slate-400">{m.theMovieWas}</p>

      {movie ? (
        <div className="mt-4 flex items-center gap-3">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" className="h-24 w-16 rounded-lg object-cover" />
          ) : (
            <span className="flex h-24 w-16 items-center justify-center rounded-lg bg-white/5 text-[10px] text-slate-500">
              N/A
            </span>
          )}
          <div>
            <p className="font-display text-lg font-bold text-white">{movie.title}</p>
            {movie.year ? <p className="text-sm text-slate-400">{movie.year}</p> : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onAgain}
        disabled={busy}
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-cinema-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c00812] disabled:opacity-60"
      >
        {m.playAgain}
      </button>
    </div>
  );
}
