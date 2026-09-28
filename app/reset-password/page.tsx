'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, Clapperboard, KeyRound } from 'lucide-react';

import { isSupabaseConfigured, getSupabaseBrowser } from '@/app/lib/supabaseClient';
import { Spinner } from '@/app/components/ui';

const inputClasses =
  'w-full rounded-xl border border-cinema-line bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cinema-accent/70 focus:bg-white/[0.06]';

export default function ResetPasswordPage() {
  const [exchanging, setExchanging] = useState(true);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setExchangeError('Supabase non configurato.');
      setExchanging(false);
      return;
    }

    // Il link ricevuto via email contiene un `code`: viene scambiato con
    // una sessione, poi ripuliamo l'URL per mostrare il form.
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      setExchangeError('Link di recupero mancante o non valido.');
      setExchanging(false);
      return;
    }

    let active = true;
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (!active) return;
      window.history.replaceState({}, '', '/reset-password');
      if (exchangeError) {
        setExchangeError(exchangeError.message);
      }
      setExchanging(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Supabase non configurato.');
      return;
    }
    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri.');
      return;
    }
    if (password !== confirm) {
      setError('Le password non coincidono.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPassword('');
    setConfirm('');
    setInfo('Password aggiornata. Ora puoi accedere con la nuova password.');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="cinema-strip h-1 w-full bg-cinema-accent/90" />

      <div className="w-full max-w-md">
        <div className="animate-fade-up rounded-2xl border border-cinema-line bg-cinema-surface p-6 shadow-card">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cinema-accent/15 text-cinema-accent">
              <Clapperboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">CineClue</h1>
              <p className="text-xs uppercase tracking-widest text-slate-400">Nuova password</p>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <KeyRound className="h-4 w-4" />
            <span>Imposta una nuova password per il tuo account.</span>
          </div>

          {exchanging ? (
            <div className="flex items-center justify-center gap-3 py-6 text-slate-400">
              <Spinner className="h-5 w-5" /> Verifico il link…
            </div>
          ) : exchangeError ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{exchangeError}. Richiedi un nuovo link dalla schermata di accesso.</p>
              </div>
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-xl bg-cinema-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c00812]"
              >
                Torna a CineClue
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {info ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{info}</p>
                </div>
              ) : null}
              {error ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Nuova password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Almeno 6 caratteri"
                  autoComplete="new-password"
                  className={inputClasses}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Conferma password
                </span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Ripeti la password"
                  autoComplete="new-password"
                  className={inputClasses}
                />
              </label>
              <button
                type="submit"
                disabled={submitting || !isSupabaseConfigured()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cinema-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c00812] active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? <Spinner className="h-4 w-4" /> : null}
                Salva nuova password
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-600">
          <Link href="/" className="text-slate-500 transition hover:text-white">
            ← Torna a CineClue
          </Link>
        </p>
      </div>
    </div>
  );
}