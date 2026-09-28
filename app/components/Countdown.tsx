'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

import { secondsUntilMidnightUTC } from '@/app/lib/dates';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Countdown a mezzanotte UTC, aggiornato ogni secondo. */
export default function Countdown() {
  const [seconds, setSeconds] = useState<number>(() => secondsUntilMidnightUTC());

  useEffect(() => {
    const t = setInterval(() => setSeconds(secondsUntilMidnightUTC()), 1000);
    return () => clearInterval(t);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-cinema-line bg-white/[0.03] px-3.5 py-2 text-sm">
      <Clock className="h-4 w-4 text-cinema-gold" />
      <span className="text-slate-300">Prossimo film in</span>
      <span className="font-mono text-base font-bold tabular-nums text-white">
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    </div>
  );
}