'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';

import type { LeaderboardEntry } from '@/app/lib/types';
import { fetchLeaderboard, type LeaderboardRow } from '@/app/lib/supabaseClient';
import { isSupabaseConfigured } from '@/app/lib/supabaseClient';
import { useLocale } from '@/app/lib/i18n';
import { Modal, Spinner } from './ui';

interface LeaderboardModalProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string | null;
}

function formatPoints(points: number | null, locale: string): string {
  if (points == null) return '—';
  return points.toLocaleString(locale === 'en' ? 'en-US' : 'it-IT');
}

function toEntries(rows: LeaderboardRow[]): LeaderboardEntry[] {
  return rows.map((r) => ({
    userId: r.userId,
    username: r.username,
    totalPoints: r.totalPoints,
    totalWins: r.totalWins,
    currentStreak: r.currentStreak
  }));
}

export default function LeaderboardModal({ open, onClose, currentUserId }: LeaderboardModalProps) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [setupRequired, setSetupRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const { locale, m } = useLocale();
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSetupRequired(false);
    fetchLeaderboard()
      .then(({ rows: r, setupRequired: setup }) => {
        setRows(toEntries(r));
        setSetupRequired(setup);
      })
      .catch(() => setSetupRequired(false))
      .finally(() => setLoading(false));
    setPage(0);
  }, [open]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pages - 1);
  const visible = rows.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <Modal open={open} onClose={onClose} title={m.leaderboard} maxWidth="max-w-lg">
      {!isSupabaseConfigured() ? (
        <div className="py-4 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-400">
            {m.lbUnavailable}
          </p>
          <p className="mt-2 font-mono text-[11px] text-slate-600">NEXT_PUBLIC_SUPABASE_*</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : setupRequired ? (
        <div className="space-y-2 py-4 text-center">
          <p className="text-sm text-slate-400">
            {m.lbSetup}
          </p>
          <p className="text-xs text-slate-500">
            {m.lbSetupHint}
          </p>
        </div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          {m.lbEmpty}
        </p>
      ) : (
        <>
          <ol className="space-y-1.5">
            {visible.map((row, i) => {
              const rank = clampedPage * PAGE_SIZE + i + 1;
              const isMe = currentUserId !== null && row.userId === currentUserId;
              return (
                <li
                  key={row.userId}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
                    isMe
                      ? 'border-cinema-gold/60 bg-cinema-gold/10'
                      : 'border-cinema-line bg-white/[0.02]'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold ${
                      rank === 1
                        ? 'bg-cinema-gold text-black'
                        : rank === 2
                          ? 'bg-slate-300 text-black'
                          : rank === 3
                            ? 'bg-orange-700 text-white'
                            : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {row.username || m.player}
                      {isMe ? <span className="ml-2 text-[10px] text-cinema-gold">{m.you}</span> : null}
                    </p>
                    <p className="text-[11px] text-slate-500">{m.winsCount(row.totalWins)} · 🔥 {row.currentStreak}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-base font-bold text-cinema-gold">
                      {formatPoints(row.totalPoints, locale)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">{m.points}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={clampedPage === 0}
                aria-label={m.prevPage}
                className="rounded-lg p-1.5 text-slate-400 transition hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-xs font-semibold text-slate-400">
                {clampedPage + 1} / {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                disabled={clampedPage >= pages - 1}
                aria-label={m.nextPage}
                className="rounded-lg p-1.5 text-slate-400 transition hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}