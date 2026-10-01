'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CornerDownLeft, Search, SearchX } from 'lucide-react';

import type { SearchResult } from '@/app/lib/types';
import { useLocale } from '@/app/lib/i18n';
import { Spinner } from './ui';

interface SearchInputProps {
  disabled?: boolean;
  submitting?: boolean;
  onSelect: (movie: { id: number; title: string; year: number | null; posterPath: string | null }) => void;
}

function posterUrl(path: string | null): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w92${path}`;
}

export default function SearchInput({ disabled, submitting, onSelect }: SearchInputProps) {
  const { locale, m } = useLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback((text: string) => {
    const seq = ++seqRef.current;
    setSearching(true);
    setError(null);
    fetch(`/api/search?q=${encodeURIComponent(text)}&lang=${locale}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(m.searchUnavailable);
        return (await res.json()) as { results: SearchResult[] };
      })
      .then((data) => {
        if (seq !== seqRef.current) return;
        setResults(data.results ?? []);
        setActiveIndex(-1);
        setOpen(true);
      })
      .catch(() => {
        if (seq !== seqRef.current) return;
        setError(m.searchFailed);
        setOpen(true);
      })
      .finally(() => {
        if (seq === seqRef.current) setSearching(false);
      });
  }, [locale, m.searchFailed, m.searchUnavailable]);

  // Debounce della ricerca mentre si digita.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      setError(null);
      setSearching(false);
      return;
    }

    const text = query.trim();
    debounceRef.current = setTimeout(() => runSearch(text), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  // Chiudi il dropdown cliccando fuori.
  useEffect(() => {
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const pick = (movie: SearchResult) => {
    if (disabled || submitting) return;
    onSelect(movie);
    setQuery('');
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActiveIndex((i) => Math.max(i - 1, -1));
      return;
    }
    if (e.key === 'Enter') {
      // Invio: seleziona il risultato attivo, altrimenti il primo disponibile;
      // se non c'è ancora nulla, esegue subito la ricerca.
      e.preventDefault();
      if (submitting || disabled) return;
      if (activeIndex >= 0 && results[activeIndex]) {
        pick(results[activeIndex]);
      } else if (results.length > 0) {
        pick(results[0]);
      } else if (query.trim()) {
        runSearch(query.trim());
      }
    }
  };

  const hasQuery = query.trim().length > 0;
  const showDropdown = open && hasQuery && (results.length > 0 || searching || !!error);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          disabled={disabled || submitting}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => hasQuery && (results.length > 0 || searching) && setOpen(true)}
          placeholder={
            disabled ? m.searchDone : submitting ? m.searchScoring : m.searchPlaceholder
          }
          className="w-full rounded-2xl border border-cinema-line bg-cinema-surfacelight py-3.5 pl-11 pr-11 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cinema-accent/70 focus:ring-2 focus:ring-cinema-accent/30 disabled:opacity-60"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {searching ? (
            <Spinner className="h-5 w-5 text-slate-400" />
          ) : submitting ? (
            <Spinner className="h-5 w-5 text-cinema-gold" />
          ) : null}
        </div>
      </div>

      {showDropdown && (
        <ul className="absolute z-40 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-cinema-line bg-cinema-surface py-1.5 shadow-2xl">
          {searching && results.length === 0 ? (
            <li className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
              <Spinner className="h-4 w-4" /> {m.searching(query.trim())}
            </li>
          ) : null}

          {!searching && results.length === 0 && error && (
            <li className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
              <SearchX className="h-4 w-4" /> {error}
            </li>
          )}

          {!searching && results.length === 0 && !error && (
            <li className="px-4 py-3 text-sm text-slate-400">
              {m.noMovies(query.trim())}
            </li>
          )}

          {results.map((movie, i) => (
            <li key={movie.id}>
              <button
                type="button"
                onClick={() => pick(movie)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-3 px-3.5 py-2 text-left transition ${
                  i === activeIndex ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
                }`}
              >
                {posterUrl(movie.posterPath) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={posterUrl(movie.posterPath)!}
                    alt=""
                    className="h-12 w-8 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-[9px] text-slate-500">
                    N/A
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{movie.title}</span>
                  <span className="text-xs text-slate-400">{movie.year ?? m.unknownYear}</span>
                </span>
                {i === activeIndex && (
                  <span className="shrink-0 text-slate-500">
                    <CornerDownLeft className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}