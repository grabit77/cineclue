'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, Clapperboard, KeyRound } from 'lucide-react';

import { isSupabaseConfigured, getSupabaseBrowser } from '@/app/lib/supabaseClient';
import { knownError, LanguageSwitch, useLocale } from '@/app/lib/i18n';
import { Spinner } from '@/app/components/ui';

const inputClasses =
  'w-full rounded-xl border border-cinema-line bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cinema-accent/70 focus:bg-white/[0.06]';

export default function ResetPasswordPage() {
  const { m } = useLocale();
  const messagesRef = useRef(m);
  messagesRef.current = m;
  const [exchanging, setExchanging] = useState(true);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    // Leggere l'URL prima di creare il client: all'avvio Supabase può
    // consumare il frammento #access_token del link di recupero.
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setExchangeError(messagesRef.current.supabaseMissing);
      setExchanging(false);
      return;
    }

    // L'email di Supabase può arrivare in tre forme: ?code= (PKCE),
    // ?token_hash=, oppure #access_token= dopo /auth/v1/verify.
    const code = params.get('code');
    const tokenHash = params.get('token_hash');
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');

    let active = true;
    const finish = (message: string | null) => {
      if (!active) return;
      window.history.replaceState({}, '', '/reset-password');
      if (message) setExchangeError(message);
      setExchanging(false);
    };

    const establish = async () => {
      if (code) {
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
        finish(codeError ? codeError.message : null);
        return;
      }

      if (tokenHash) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery'
        });
        finish(otpError ? otpError.message : null);
        return;
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        finish(sessionError ? sessionError.message : null);
        return;
      }

      const { data } = await supabase.auth.getSession();
      finish(data.session ? null : messagesRef.current.resetMissing);
    };

    establish().catch(() => finish(messagesRef.current.resetMissing));
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
      setError(m.supabaseMissing);
      return;
    }
    if (password.length < 6) {
      setError(m.errPasswordShort);
      return;
    }
    if (password !== confirm) {
      setError(m.errPasswordMatch);
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(knownError(updateError.message, m));
      return;
    }

    setPassword('');
    setConfirm('');
    setInfo(m.passwordUpdated);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="cinema-strip h-1 w-full bg-cinema-accent/90" />

      <div className="w-full max-w-md">
        <div className="animate-fade-up rounded-2xl border border-cinema-line bg-cinema-surface p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cinema-accent/15 text-cinema-accent">
                <Clapperboard className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-white">CineClue</h1>
                <p className="text-xs uppercase tracking-widest text-slate-400">{m.resetTitle}</p>
              </div>
            </div>
            <LanguageSwitch />
          </div>

          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <KeyRound className="h-4 w-4" />
            <span>{m.resetIntro}</span>
          </div>

          {exchanging ? (
            <div className="flex items-center justify-center gap-3 py-6 text-slate-400">
              <Spinner className="h-5 w-5" /> {m.resetChecking}
            </div>
          ) : exchangeError ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  {exchangeError} {m.resetAskAgain}
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-xl bg-cinema-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c00812]"
              >
                {m.backHome}
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
                  {m.newPassword}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={m.passwordMin}
                  autoComplete="new-password"
                  className={inputClasses}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {m.confirmPassword}
                </span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={m.repeatPassword}
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
                {m.savePassword}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-600">
          <Link href="/" className="text-slate-500 transition hover:text-white">
            ← {m.backHome}
          </Link>
        </p>
      </div>
    </div>
  );
}