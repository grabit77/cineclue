'use client';

import type { Profile } from '@/app/lib/types';
import { MAX_ATTEMPTS } from '@/app/lib/types';
import { useLocale } from '@/app/lib/i18n';
import { Modal } from './ui';

function WinRateBar({ rate }: { rate: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
      <div
        className="h-full rounded-full bg-emerald-500 transition-all duration-700"
        style={{ width: `${rate}%` }}
      />
    </div>
  );
}

export default function StatsModal({ open, onClose, profile }: { open: boolean; onClose: () => void; profile: Profile }) {
  const { m } = useLocale();
  const winRate = profile.gamesPlayed > 0 ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100) : 0;

  const distribution = Array.from({ length: MAX_ATTEMPTS }, (_, i) => String(i + 1));
  const maxCount = Math.max(1, ...distribution.map((k) => profile.distribution[k] ?? 0));

  return (
    <Modal open={open} onClose={onClose} title={m.yourStats}>
      <div className="grid grid-cols-4 gap-3 text-center">
        <Stat label={m.played} value={profile.gamesPlayed} />
        <Stat label={m.won} value={profile.gamesWon} />
        <Stat label={m.streak} value={profile.currentStreak} accent />
        <Stat label={m.max} value={profile.maxStreak} />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-400">
          <span>{m.winRate}</span>
          <span className="font-bold text-white">{winRate}%</span>
        </div>
        <WinRateBar rate={winRate} />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          {m.distribution}
        </p>
        <ul className="space-y-1.5">
          {distribution.map((k) => {
            const count = profile.distribution[k] ?? 0;
            const width = Math.max(6, (count / maxCount) * 100);
            return (
              <li key={k} className="flex items-center gap-2 text-sm">
                <span className="w-5 font-mono text-xs font-semibold text-slate-400">{k}</span>
                <div className="h-6 flex-1 overflow-hidden rounded-lg bg-white/5">
                  <div
                    className="flex h-full items-center rounded-lg bg-gradient-to-r from-cinema-accent to-orange-400 px-2 transition-all duration-700"
                    style={{ width: `${width}%` }}
                  >
                    <span className="text-xs font-bold text-white">{count || ''}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-5 text-center text-[11px] text-slate-500">
        {m.pointsRule}
      </p>
    </Modal>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-cinema-line bg-white/[0.03] px-2 py-3">
      <p className={`text-2xl font-bold ${accent ? 'text-cinema-gold' : 'text-white'}`}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}