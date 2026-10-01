'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';

import { useLocale } from '@/app/lib/i18n';

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md'
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}) {
  const { m } = useLocale();
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidth} animate-fade-up rounded-t-2xl border border-cinema-line bg-cinema-surface p-5 shadow-2xl sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label={m.close}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function primaryButtonClasses(extra = ''): string {
  return `inline-flex items-center justify-center gap-2 rounded-xl bg-cinema-accent font-semibold text-white transition hover:bg-[#c00812] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${extra}`;
}

export function ghostButtonClasses(extra = ''): string {
  return `inline-flex items-center justify-center gap-2 rounded-xl border border-cinema-line bg-white/[0.03] font-semibold text-slate-200 transition hover:bg-white/[0.07] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${extra}`;
}