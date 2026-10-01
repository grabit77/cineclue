'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CloudOff, KeyRound, LogOut, Mail } from 'lucide-react';

import { useAuth } from '@/app/hooks/useAuth';
import { useLocale } from '@/app/lib/i18n';
import { Modal, Spinner } from './ui';

type Mode = 'login' | 'register' | 'forgot';

const inputClasses =
  'w-full rounded-xl border border-cinema-line bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cinema-accent/70 focus:bg-white/[0.06]';

export default function AuthModal({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { configured, loading, user, signInWithPassword, signUp, resetPasswordForEmail, signOut } =
    useAuth();
  const { m } = useLocale();

  const [mode, setMode] = useState<Mode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDisplayName('');
    setEmail('');
    setPassword('');
    setConfirm('');
    setError(null);
    setInfo(null);
  }, [open, mode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email || !password) {
      setError(m.errEmailPassword);
      return;
    }
    setSubmitting(true);
    const result = await signInWithPassword(email.trim(), password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const cleanEmail = email.trim();
    const cleanName = displayName.trim().replace(/\s+/g, ' ');
    if (cleanName.length < 2 || cleanName.length > 24 || cleanName.includes('@')) {
      setError(m.errName);
      return;
    }
    if (!cleanEmail || !password) {
      setError(m.errEmailPassword);
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
    const result = await signUp(cleanEmail, password, cleanName);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsEmailConfirmation) {
      setEmail('');
      setPassword('');
      setConfirm('');
      setInfo(m.errConfirmEmail);
    } else {
      onClose();
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email) {
      setError(m.errEmailRequired);
      return;
    }
    setSubmitting(true);
    const result = await resetPasswordForEmail(email.trim());
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setInfo(m.errResetSent);
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={m.authTitle}>
      {!configured ? (
        <div className="space-y-3 py-2 text-center">
          <CloudOff className="mx-auto h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-400">
            {m.guestOnly}
          </p>
          <p className="text-xs text-slate-500">{m.guestSetup}</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : user ? (
        <div className="space-y-4 py-1">
          <div className="rounded-xl border border-cinema-line bg-white/[0.03] p-4 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-cinema-accent/20 text-lg font-bold text-cinema-accent">
              {(user.name ?? user.email ?? '?').slice(0, 1).toUpperCase()}
            </div>
            <p className="font-semibold text-white">{user.name ?? m.accountLinked}</p>
            {user.email ? <p className="text-xs text-slate-500">{user.email}</p> : null}
            <p className="mt-2 text-[11px] text-emerald-400">
              {m.synced}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cinema-line bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
          >
            <LogOut className="h-4 w-4" /> {m.signOutAccount}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            {m.authIntro}
          </p>

          {mode !== 'forgot' ? (
            <div className="flex rounded-xl border border-cinema-line bg-white/[0.02] p-1">
              {(['login', 'register'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMode(tab)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    mode === tab
                      ? 'bg-cinema-accent text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'login' ? m.signIn : m.register}
                </button>
              ))}
            </div>
          ) : null}

          {info ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-300">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{info}</p>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          {mode === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {m.email}
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@esempio.com"
                  autoComplete="email"
                  className={inputClasses}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {m.password}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={inputClasses}
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cinema-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c00812] active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? <Spinner className="h-4 w-4" /> : null}
                {m.signIn}
              </button>
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="mx-auto flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-white"
              >
                <KeyRound className="h-3.5 w-3.5" /> {m.forgot}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {m.leaderboardName}
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={m.namePlaceholder}
                  autoComplete="nickname"
                  maxLength={24}
                  className={inputClasses}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {m.email}
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@esempio.com"
                  autoComplete="email"
                  className={inputClasses}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {m.password}
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
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cinema-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c00812] active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? <Spinner className="h-4 w-4" /> : null}
                {m.register}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-3">
              <p className="text-xs text-slate-500">
                {m.forgotHelp}
              </p>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {m.email}
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@esempio.com"
                  autoComplete="email"
                  className={inputClasses}
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cinema-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c00812] active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? <Spinner className="h-4 w-4" /> : null}
                {m.sendReset}
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="mx-auto flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {m.backToSignIn}
              </button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}