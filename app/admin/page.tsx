'use client';

import { useEffect, useState } from 'react';
import type { SearchResult } from '@/app/lib/types';
import { knownError, LanguageSwitch, useLocale } from '@/app/lib/i18n';

interface DayCard {
  date: string;
  puzzleNumber: number;
  locked: boolean;
  manual: boolean;
  movie: { id: number; title: string; year: number | null; posterPath: string | null };
}

interface BoardRow {
  userId: string;
  username: string | null;
  totalPoints: number;
  totalWins: number;
  currentStreak: number;
}

interface Overview {
  days: DayCard[];
  rows: BoardRow[];
  stats: { accounts: number; anonymous: number; wins: number; points: number };
}

function poster(path: string | null): string | null {
  return path ? `https://image.tmdb.org/t/p/w92${path}` : null;
}

export default function AdminPage() {
  const { locale, m } = useLocale();
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch('/api/admin/overview', { cache: 'no-store' });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    if (!res.ok) {
      setError(m.adminLoadFail);
      return;
    }
    setOverview((await res.json()) as Overview);
    setAuthed(true);
  };

  useEffect(() => {
    load().catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}&lang=${locale}`)
        .then((res) => res.json())
        .then((data: { results?: SearchResult[] }) => setResults(data.results ?? []))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, locale]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setError(knownError(payload?.error ?? m.adminDenied, m));
      return;
    }
    setPassword('');
    await load();
  };

  const assign = async (movieId: number) => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const res = await fetch('/api/admin/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selected, movieId })
    });
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (!res.ok) {
      setError(knownError(payload?.error ?? m.adminSaveFail, m));
      return;
    }
    setQuery('');
    setResults([]);
    await load();
  };

  const restore = async (date: string) => {
    setBusy(true);
    await fetch('/api/admin/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, clear: true })
    });
    setBusy(false);
    await load();
  };

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
        <div className="mb-4 flex justify-end">
          <LanguageSwitch />
        </div>
        <h1 className="font-display text-3xl font-black text-white">{m.adminTitle}</h1>
        <p className="mt-2 text-sm text-slate-400">{m.adminPassword}</p>
        <form onSubmit={login} className="mt-6 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-cinema-line bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none focus:border-cinema-accent/70"
            placeholder={m.password}
          />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button className="w-full rounded-xl bg-cinema-accent px-4 py-2.5 text-sm font-semibold text-white">
            {m.adminEnter}
          </button>
        </form>
      </main>
    );
  }

  const selectedDay = overview?.days.find((day) => day.date === selected) ?? null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-white">{m.adminTitle}</h1>
          <p className="text-sm text-slate-400">{m.adminSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <button
            onClick={() => fetch('/api/admin/logout', { method: 'POST' }).then(() => setAuthed(false))}
            className="text-sm text-slate-400 hover:text-white"
          >
            {m.signOut}
          </button>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

      <section className="mb-8 grid gap-3 sm:grid-cols-4">
        {[
          [m.adminAccounts, overview?.stats.accounts ?? 0],
          [m.adminAnonymous, overview?.stats.anonymous ?? 0],
          [m.adminWins, overview?.stats.wins ?? 0],
          [m.adminPoints, overview?.stats.points ?? 0]
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-cinema-line bg-cinema-surface px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
            <p className="font-mono text-2xl font-bold text-cinema-gold">{value}</p>
          </div>
        ))}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-xl font-bold text-white">{m.calendar}</h2>
        <p className="mb-3 text-xs text-slate-500">{m.calendarHelp}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {overview?.days.map((day) => (
            <button
              key={day.date}
              type="button"
              disabled={day.locked || busy}
              onClick={() => {
                setSelected(day.date);
                setQuery('');
                setResults([]);
              }}
              className={`rounded-2xl border px-3 py-2.5 text-left ${
                day.date === selected
                  ? 'border-cinema-gold bg-cinema-gold/10'
                  : 'border-cinema-line bg-cinema-surface'
              } ${day.locked ? 'opacity-70' : 'hover:border-cinema-gold/50'}`}
            >
              <p className="text-[11px] text-slate-500">
                {day.date} · #{day.puzzleNumber} {day.locked ? `· ${m.today}` : day.manual ? `· ${m.chosen}` : `· ${m.automatic}`}
              </p>
              <p className="truncate text-sm font-semibold text-white">
                {day.movie.title} {day.movie.year ? `(${day.movie.year})` : ''}
              </p>
            </button>
          ))}
        </div>

        {selectedDay && !selectedDay.locked ? (
          <div className="mt-4 rounded-2xl border border-cinema-line bg-cinema-surface p-4">
            <p className="text-sm text-slate-300">
              {m.replaceMovie(selectedDay.date)}
            </p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={m.searchMovie}
              className="mt-3 w-full rounded-xl border border-cinema-line bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
            />
            <ul className="mt-2 max-h-64 overflow-auto">
              {results.map((movie) => (
                <li key={movie.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => assign(movie.id)}
                    className="flex w-full items-center gap-3 px-1 py-1.5 text-left hover:bg-white/[0.04]"
                  >
                    {poster(movie.posterPath) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={poster(movie.posterPath)!} alt="" className="h-10 w-7 rounded object-cover" />
                    ) : (
                      <span className="h-10 w-7 rounded bg-white/10" />
                    )}
                    <span className="text-sm text-white">
                      {movie.title} <span className="text-slate-500">{movie.year ?? ''}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {selectedDay.manual ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => restore(selectedDay.date)}
                className="mt-3 text-xs text-slate-400 hover:text-white"
              >
                {m.restoreAuto}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-xl font-bold text-white">{m.leaderboard}</h2>
        {overview && overview.rows.length === 0 ? (
          <p className="text-sm text-slate-500">{m.noScores}</p>
        ) : (
          <ol className="space-y-1.5">
            {overview?.rows.map((row, index) => (
              <li key={row.userId} className="flex items-center justify-between rounded-xl border border-cinema-line px-3 py-2">
                <span className="text-sm text-white">
                  {index + 1}. {row.username || m.player}
                  <span className="ml-2 text-xs text-slate-500">{m.winsCount(row.totalWins)}</span>
                </span>
                <span className="font-mono text-sm text-cinema-gold">{row.totalPoints}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
