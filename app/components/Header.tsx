'use client';

import { Activity, Clapperboard, LogIn, LogOut, Trophy } from 'lucide-react';

import { LanguageSwitch, useLocale } from '@/app/lib/i18n';

interface HeaderProps {
  puzzleNumber: number | null;
  onOpenLeaderboard: () => void;
  onOpenStats: () => void;
  onOpenAuth: () => void;
  user: { name?: string | null; email?: string | null } | null;
  authConfigured: boolean;
  onSignOut: () => void;
}

export default function Header({
  puzzleNumber,
  onOpenLeaderboard,
  onOpenStats,
  onOpenAuth,
  user,
  authConfigured,
  onSignOut
}: HeaderProps) {
  const { m } = useLocale();
  return (
    <header className="sticky top-0 z-30 border-b border-cinema-line/70 bg-cinema-bg/80 backdrop-blur">
      <div className="cinema-strip h-1 w-full bg-cinema-accent/90" />
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cinema-accent/15 text-cinema-accent">
            <Clapperboard className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-xl font-bold tracking-wide text-white">
              Cine<span className="text-cinema-accent">Clue</span>
            </h1>
            {puzzleNumber ? (
              <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                {m.puzzleOfDay(puzzleNumber)}
              </p>
            ) : (
              <p className="text-[11px] uppercase tracking-widest text-slate-500">{m.loading}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <LanguageSwitch />
          <button
            onClick={onOpenStats}
            aria-label={m.yourStats}
            title={m.stats}
            className="rounded-lg p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <Activity className="h-5 w-5" />
          </button>
          <button
            onClick={onOpenLeaderboard}
            aria-label={m.leaderboard}
            title={m.leaderboard}
            className="rounded-lg p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <Trophy className="h-5 w-5" />
          </button>

          {authConfigured ? (
            user ? (
              <button
                onClick={onOpenAuth}
                aria-label={m.account}
                title={user.email ?? undefined}
                className="ml-1 flex h-9 max-w-[140px] items-center gap-2 rounded-xl border border-cinema-line bg-white/[0.04] px-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cinema-accent/20 text-cinema-accent">
                  {(user.name ?? '?').slice(0, 1).toUpperCase()}
                </span>
                <span className="truncate">{user.name ?? m.profile}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                aria-label={m.signIn}
                title={m.signInTitle}
                className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-xl bg-cinema-accent px-3 text-xs font-semibold text-white transition hover:bg-[#c00812]"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">{m.signIn}</span>
              </button>
            )
          ) : null}

          {user ? (
            <button
              onClick={onSignOut}
              aria-label={m.signOut}
              title={m.signOut}
              className="rounded-lg p-2 text-slate-400 transition hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}