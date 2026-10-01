'use client';

import { AlertTriangle, KeyRound } from 'lucide-react';

import { useLocale } from '@/app/lib/i18n';

export default function SetupBanner() {
  const { m } = useLocale();
  return (
    <div className="animate-pop rounded-2xl border border-cinema-gold/40 bg-cinema-gold/[0.06] p-6 shadow-card">
      <div className="mb-3 flex items-center gap-2 text-cinema-gold">
        <AlertTriangle className="h-5 w-5" />
        <h2 className="font-display text-lg font-bold text-white">{m.setupTitle}</h2>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-slate-300">{m.setupBody}</p>
      <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
        <li>
          <a
            className="text-cinema-gold underline underline-offset-2"
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noreferrer"
          >
            {m.setupStep1}
          </a>
        </li>
        <li>{m.setupStep2}</li>
        <li>{m.setupStep3}</li>
      </ol>
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <KeyRound className="h-4 w-4" /> {m.setupEnv}
      </p>
    </div>
  );
}