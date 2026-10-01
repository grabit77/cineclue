'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import {
  getSupabaseBrowser,
  isSupabaseConfigured,
  pullCloudProfile,
  pushCloudProfile,
  syncLocalWinsToDailyScores
} from '@/app/lib/supabaseClient';

export interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

interface AuthResult {
  error: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<AuthResult & { needsEmailConfirmation: boolean }>;
  resetPasswordForEmail: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  /** Carica il profilo locale sul cloud (files immagini) dopo una partita. */
  syncProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function authErrorMessage(message: string | null | undefined): string {
  const text = message ?? 'Qualcosa è andato storto. Riprova.';
  if (/email rate limit exceeded/i.test(text)) {
    return 'Troppe email inviate da Supabase. La registrazione non ne manda più: riprova tra un minuto. Il recupero password può richiedere fino a un’ora.';
  }
  if (/invalid login credentials/i.test(text)) {
    return 'Email o password non corretti.';
  }
  if (/already registered|already exists/i.test(text)) {
    return 'Esiste già un account con questa email. Prova ad accedere.';
  }
  return text;
}

function userFromSession(session: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } } | null): AuthUser | null {
  if (!session?.user) return null;
  const meta = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    email: session.user.email,
    name: (meta.username ?? meta.full_name ?? meta.name) as string | null | undefined
  };
}

/**
 * La sessione del browser vive in localStorage; i route handler server-side
 * leggono invece i cookie. Copia i token nei cookie così /api/score riuschia
 * di scrivere i punti per l'utente loggato via email/password.
 */
async function syncSessionToCookies(session: Session): Promise<void> {
  if (!session.access_token || !session.refresh_token) return;
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    })
  });
}

let sessionSync: { key: string; promise: Promise<void> } | null = null;

/** A ogni login: cookie di sessione -> profilo cloud -> vittorie pendenti in classifica. */
async function syncSessionAndCloud(session: Session): Promise<void> {
  if (!session.user.id || !session.access_token) return;
  const key = `${session.user.id}:${session.access_token}`;
  if (sessionSync?.key === key) return sessionSync.promise;

  const promise = (async () => {
    try {
      await syncSessionToCookies(session);
    } catch {
      /* best effort */
    }
    try {
      await pullCloudProfile(session.user.id);
      await syncLocalWinsToDailyScores();
    } catch {
      /* best effort */
    }
  })();
  sessionSync = { key, promise };
  return promise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) await syncSessionAndCloud(data.session);
      setUser(userFromSession(data.session));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // I cookie devono esistere prima che il gioco controlli se l'account ha già giocato.
      if (session?.user && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        void syncSessionAndCloud(session).finally(() => {
          setUser(userFromSession(session));
          setLoading(false);
        });
        return;
      }
      setUser(userFromSession(session));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return { error: 'Supabase non configurato.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? authErrorMessage(error.message) : null };
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string
    ): Promise<AuthResult & { needsEmailConfirmation: boolean }> => {
      const supabase = getSupabaseBrowser();
      if (!supabase) return { error: 'Supabase non configurato.', needsEmailConfirmation: false };

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName })
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        return { error: authErrorMessage(payload?.error), needsEmailConfirmation: false };
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? authErrorMessage(error.message) : null, needsEmailConfirmation: false };
    },
    []
  );

  const resetPasswordForEmail = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return { error: 'Supabase non configurato.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { error: error ? authErrorMessage(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const syncProfile = useCallback(async () => {
    if (!user) return;
    await pushCloudProfile(user.id);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, configured, signInWithPassword, signUp, resetPasswordForEmail, signOut, syncProfile }),
    [user, loading, configured, signInWithPassword, signUp, resetPasswordForEmail, signOut, syncProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  return ctx;
}