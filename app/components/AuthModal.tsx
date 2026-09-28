'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CloudOff, KeyRound, LogOut, Mail } from 'lucide-react';

import { useAuth } from '@/app/hooks/useAuth';
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
      setError('Inserisci email e password.');
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
      setError('Scegli un nome da 2 a 24 caratteri, senza usare l’email.');
      return;
    }
    if (!cleanEmail || !password) {
      setError('Inserisci email e password.');
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
      setInfo('Controlla la tua email e clicca sul link di conferma per attivare l\'account, poi accedi.');
    } else {
      onClose();
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email) {
      setError('Inserisci la tua email.');
      return;
    }
    setSubmitting(true);
    const result = await resetPasswordForEmail(email.trim());
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setInfo('Se l\'email esiste, ti abbiamo inviato un link per reimpostare la password.');
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Account e salvataggio cloud">
      {!configured ? (
        <div className="space-y-3 py-2 text-center">
          <CloudOff className="mx-auto h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-400">
            Attualmente usi la modalità <strong className="text-white">Guest</strong>: il progresso è
            salvato solo su questo dispositivo.
          </p>
          <p className="text-xs text-slate-500">
            Per attivare account e sincronizzazione cloud (email + password), configura un progetto
            Supabase con il provider <strong className="text-slate-300">Email</strong> abilitato e
            imposta le variabili <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> e{' '}
            <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>.
          </p>
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
            <p className="font-semibold text-white">{user.name ?? 'Account collegato'}</p>
            {user.email ? <p className="text-xs text-slate-500">{user.email}</p> : null}
            <p className="mt-2 text-[11px] text-emerald-400">
              Salvataggio sincronizzato con il cloud ✓
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cinema-line bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
          >
            <LogOut className="h-4 w-4" /> Esci dall'account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Accedi per sincronizzare statistiche e streak e partecipare alla classifica globale.
            Puoi continuare a giocare come <strong className="text-white">Guest</strong> in qualsiasi
            momento.
          </p>

          {mode !== 'forgot' ? (
            <div className="flex rounded-xl border border-cinema-line bg-white/[0.02] p-1">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    mode === m
                      ? 'bg-cinema-accent text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'login' ? 'Accedi' : 'Registrati'}
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
                  Email
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
                  Password
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
                Accedi
              </button>
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="mx-auto flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-white"
              >
                <KeyRound className="h-3.5 w-3.5" /> Password dimenticata?
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Nome in classifica
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Es. Marco"
                  autoComplete="nickname"
                  maxLength={24}
                  className={inputClasses}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email
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
                  Password
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
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cinema-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c00812] active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? <Spinner className="h-4 w-4" /> : null}
                Registrati
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-3">
              <p className="text-xs text-slate-500">
                Inserisci l'email dell'account: riceverai un link per reimpostare la password.
              </p>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email
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
                Invia link di recupero
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="mx-auto flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Torna all'accesso
              </button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}