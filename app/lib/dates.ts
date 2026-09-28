import type { PuzzleDate } from './types';

const DAY_MS = 86_400_000;
/** Data base (1 gennaio 2025) usata per numerare i puzzle. */
const BASE_DATE = Date.UTC(2025, 0, 1);

/** Data odierna in UTC come stringa YYYY-MM-DD. */
export function todayUTC(): PuzzleDate {
  const now = new Date();
  return [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0')
  ].join('-');
}

/** Numero progressivo del puzzle, stabile per ogni data. */
export function puzzleNumber(date: PuzzleDate): number {
  const [y, m, d] = date.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d);
  return Math.floor((t - BASE_DATE) / DAY_MS) + 1;
}

/** Aggiunge n giorni a una data UTC (per confronti streak). */
export function addDaysUTC(date: PuzzleDate, n: number): PuzzleDate {
  const [y, m, d] = date.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + n * DAY_MS;
  const dt = new Date(t);
  return [
    dt.getUTCFullYear(),
    String(dt.getUTCMonth() + 1).padStart(2, '0'),
    String(dt.getUTCDate()).padStart(2, '0')
  ].join('-');
}

export function isValidPuzzleDate(date: string): date is PuzzleDate {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/** Secondi mancanti alla mezzanotte UTC (per il countdown). */
export function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
}