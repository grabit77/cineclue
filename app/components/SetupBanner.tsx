'use client';

import { AlertTriangle, KeyRound } from 'lucide-react';

export default function SetupBanner() {
  return (
    <div className="animate-pop rounded-2xl border border-cinema-gold/40 bg-cinema-gold/[0.06] p-6 shadow-card">
      <div className="mb-3 flex items-center gap-2 text-cinema-gold">
        <AlertTriangle className="h-5 w-5" />
        <h2 className="font-display text-lg font-bold text-white">TMDb non configurato</h2>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-slate-300">
        CineClue funziona tramite le API di The Movie Database. Per abilitare il gioco:
      </p>
      <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
        <li>
          Richiedi una chiave gratuita su{' '}
          <a
            className="text-cinema-gold underline underline-offset-2"
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noreferrer"
          >
            themoviedb.org/settings/api
          </a>
        </li>
        <li>
          Imposta la variabile <span className="font-mono text-cinema-gold">TMDB_API_KEY</span> nel
          file <span className="font-mono">.env.local</span>
        </li>
        <li>Riavvia il server di sviluppo</li>
      </ol>
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <KeyRound className="h-4 w-4" /> Copia il file <span className="font-mono">.env.local.example</span> →{' '}
        <span className="font-mono">.env.local</span> e inserisci le tue chiavi.
      </p>
    </div>
  );
}