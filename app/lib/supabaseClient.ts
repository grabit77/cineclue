'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { Profile } from './types';
import {
  applyResult,
  defaultProfile,
  loadProfile,
  pointsForWin,
  saveProfile
} from './storage';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return !!url && !!anonKey;
}

let browserClient: SupabaseClient | null = null;

/** Client Supabase per il browser (anon + RLS). null se non configurato.
 *  Istanza UNICA riusata ovunque: più istanze con autoRefreshToken attivo
 *  si notificano a vicenda via storage e innescano un loop di refresh. */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }
  return browserClient;
}

/* ------------------------------------------------------------------ */
/*  Sync del profilo tra localStorage (guest) e cloud (account).       */
/* ------------------------------------------------------------------ */

export interface CloudProfile {
  games_played: number;
  games_won: number;
  current_streak: number;
  max_streak: number;
  guess_distribution: Record<string, number>;
  wins_by_date: Record<string, number>;
}

interface UserRow {
  id: string;
  username: string | null;
  games_played: number;
  games_won: number;
  current_streak: number;
  max_streak: number;
  guess_distribution: Record<string, number>;
  wins_by_date: Record<string, number>;
}

function toCloudProfile(p: Profile): CloudProfile {
  return {
    games_played: p.gamesPlayed,
    games_won: p.gamesWon,
    current_streak: p.currentStreak,
    max_streak: p.maxStreak,
    guess_distribution: p.distribution,
    wins_by_date: p.winsByDate
  };
}

function fromCloudProfile(row: UserRow, base?: Profile): Profile {
  const baseProfile = base ?? defaultProfile();
  return {
    ...baseProfile,
    gamesPlayed: row.games_played ?? 0,
    gamesWon: row.games_won ?? 0,
    currentStreak: row.current_streak ?? 0,
    maxStreak: row.max_streak ?? 0,
    distribution: { ...baseProfile.distribution, ...(row.guess_distribution ?? {}) },
    winsByDate: row.wins_by_date ?? {}
  };
}

/** Scarica il profilo cloud e lo applica a localStorage (lato client). */
const profilePullsInFlight = new Set<string>();

export async function pullCloudProfile(userId: string): Promise<Profile> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return loadProfile();
  if (profilePullsInFlight.has(userId)) return loadProfile();
  profilePullsInFlight.add(userId);
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (error) return loadProfile();
    if (!data) {
      const empty = defaultProfile();
      saveProfile(empty);
      return empty;
    }

    const cloud = fromCloudProfile(data as UserRow);
    saveProfile(cloud);
    return cloud;
  } finally {
    profilePullsInFlight.delete(userId);
  }
}

/** Carica il profilo locale sul cloud (lato client via RLS). */
export async function pushCloudProfile(userId: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;

  const local = loadProfile();
  const row = toCloudProfile(local);
  const { error } = await supabase.from('users').upsert(
    { id: userId, ...row },
    { onConflict: 'id' }
  );
  if (error) console.error('[cineclue] push profilo fallito:', error.message);
}

/**
 * Salva il punteggio del giorno in `daily_scores` (server-side per
 * evitare che il client riscriva i punti). Usa fetch verso /api/score.
 * Ritorna true se il salvataggio è andato a buon fine.
 */
export async function submitDailyScore(payload: {
  date: string;
  puzzleNumber: number;
  attempts: number;
  won: boolean;
  outcome?: 'playing' | 'won' | 'lost';
  guestId?: string;
  wins?: { date: string; attempts: number }[];
  guesses?: unknown;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    /* best effort: se fallisce, il punteggio resta locale */
    return false;
  }
}

export interface LeaderboardRow {
  userId: string;
  username: string | null;
  totalPoints: number | null;
  totalWins: number;
  currentStreak: number;
}

/** Classifica globale letta dal server (service role, mai esposto al client). */
export async function fetchLeaderboard(): Promise<{ rows: LeaderboardRow[]; setupRequired: boolean }> {
  try {
    const res = await fetch('/api/leaderboard', { cache: 'no-store' });
    if (!res.ok) return { rows: [], setupRequired: false };
    const data = (await res.json()) as { rows: LeaderboardRow[]; setupRequired?: boolean };
    return { rows: data.rows ?? [], setupRequired: data.setupRequired ?? false };
  } catch {
    return { rows: [], setupRequired: false };
  }
}

export { applyResult, defaultProfile, pointsForWin };