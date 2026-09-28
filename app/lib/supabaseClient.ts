'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { Profile } from './types';
import {
  applyResult,
  computeMaxStreak,
  computeStreak,
  defaultProfile,
  guestId,
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
    const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (!data) return loadProfile();

    const cloud = fromCloudProfile(data as UserRow);
    const local = loadProfile();

    const cloudWins = Object.keys(cloud.winsByDate).length;
    const localWins = Object.keys(local.winsByDate).length;
    // Prevale la fonte più avanzata (più vittorie accumulate).
    const merged = cloudWins >= localWins ? cloud : mergeProfiles(local, cloud);
    saveProfile(merged);
    return merged;
  } finally {
    profilePullsInFlight.delete(userId);
  }
}

function mergeProfiles(a: Profile, b: Profile): Profile {
  const winsByDate = { ...b.winsByDate, ...a.winsByDate };
  const merged: Profile = {
    gamesPlayed: Math.max(a.gamesPlayed, b.gamesPlayed),
    gamesWon: Math.max(a.gamesWon, b.gamesWon),
    currentStreak: Math.max(a.currentStreak, b.currentStreak),
    maxStreak: Math.max(a.maxStreak, b.maxStreak),
    distribution: {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0,
      ...b.distribution,
      ...a.distribution
    },
    winsByDate,
    lostOnDates: { ...b.lostOnDates, ...a.lostOnDates },
    lastPlayedDate: a.lastPlayedDate ?? b.lastPlayedDate
  };
  // Ricomputa streak a partire dalle vittorie unite.
  if (merged.lastPlayedDate) {
    merged.currentStreak = computeStreak(winsByDate, merged.lastPlayedDate);
    merged.maxStreak = computeMaxStreak(winsByDate, merged.lastPlayedDate);
  }
  return merged;
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
  guestId?: string;
  wins?: { date: string; attempts: number }[];
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

const SYNCED_SCORES_KEY = 'cineclue.syncedScores';

function getSyncedDates(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SYNCED_SCORES_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function markSyncedDate(date: string): void {
  const dates = getSyncedDates();
  if (dates.includes(date)) return;
  dates.push(date);
  localStorage.setItem(SYNCED_SCORES_KEY, JSON.stringify(dates));
}

/**
 * Riporta in `daily_scores` le vittorie già giocate in locale (guest)
 * dopo l'accesso. Idempotente: ogni data viene inviata una sola volta
 * (memoizzata in localStorage). Chiamato solo all'accesso/ripristino sessione.
 */
export async function syncLocalWinsToDailyScores(): Promise<void> {
  const profile = loadProfile();
  const entries = Object.entries(profile.winsByDate ?? {});
  if (entries.length === 0) return;

  const synced = new Set(getSyncedDates());
  const pending = entries.filter(([date]) => !synced.has(date));
  if (pending.length === 0) return;

  const ok = await submitDailyScore({
    date: pending[0][0],
    puzzleNumber: 0,
    attempts: pending[0][1],
    won: true,
    guestId: guestId(),
    wins: pending.map(([date, attempts]) => ({ date, attempts }))
  });

  if (!ok) return;
  for (const [date] of pending) markSyncedDate(date);
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