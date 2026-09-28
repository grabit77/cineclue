'use client';

import { AlertCircle } from 'lucide-react';

export default function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
      <div className="animate-fade-up pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl border border-cinema-accent/50 bg-cinema-surface px-4 py-3 shadow-2xl">
        <AlertCircle className="h-4 w-4 shrink-0 text-cinema-accent" />
        <p className="text-sm text-slate-200">{message}</p>
        <button
          onClick={onDismiss}
          className="ml-1 rounded-md p-1 text-slate-400 transition hover:text-white"
          aria-label="Chiudi messaggio"
        >
          ✕
        </button>
      </div>
    </div>
  );
}