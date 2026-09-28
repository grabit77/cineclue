import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { getSupabaseAdmin } from './supabaseServer';
import type { PuzzleDate } from './types';

export interface ScheduledMovie {
  id: number;
  title: string;
  year: number | null;
  posterPath: string | null;
}

interface ScheduleFile {
  resetAt: string | null;
  overrides: Record<string, ScheduledMovie>;
}

interface ScheduleRow {
  reset_at: string | null;
  overrides: unknown;
}

const FILE = path.join(process.cwd(), 'data', 'schedule.json');
const TABLE = 'game_schedule';

function empty(): ScheduleFile {
  return { resetAt: null, overrides: {} };
}

function isMovie(value: unknown): value is ScheduledMovie {
  if (!value || typeof value !== 'object') return false;
  const row = value as ScheduledMovie;
  return Number.isInteger(row.id) && row.id > 0 && typeof row.title === 'string';
}

function normalizeOverrides(value: unknown): Record<string, ScheduledMovie> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const overrides: Record<string, ScheduledMovie> = {};
  for (const [date, movie] of Object.entries(value)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isMovie(movie)) continue;
    overrides[date] = {
      id: movie.id,
      title: movie.title,
      year: typeof movie.year === 'number' ? movie.year : null,
      posterPath: typeof movie.posterPath === 'string' ? movie.posterPath : null
    };
  }
  return overrides;
}

function fromRow(row: ScheduleRow): ScheduleFile {
  return {
    resetAt: typeof row.reset_at === 'string' ? row.reset_at : null,
    overrides: normalizeOverrides(row.overrides)
  };
}

function readLocal(): ScheduleFile {
  try {
    const parsed = JSON.parse(readFileSync(FILE, 'utf8')) as ScheduleFile;
    return {
      resetAt: parsed.resetAt ?? null,
      overrides: normalizeOverrides(parsed.overrides)
    };
  } catch {
    return empty();
  }
}

function writeLocal(data: ScheduleFile): void {
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return error.code === '42P01' || error.code === 'PGRST205' || /game_schedule|does not exist|schema cache/i.test(error.message ?? '');
}

const MISSING_TABLE =
  'Il calendario non è ancora sul database. In Supabase apri SQL Editor ed esegui la sezione game_schedule di supabase/schema.sql, poi riprova.';

let cached: { at: number; data: ScheduleFile } | null = null;
let inflight: Promise<ScheduleFile> | null = null;
const CACHE_MS = 5000;

function remember(data: ScheduleFile): ScheduleFile {
  cached = { at: Date.now(), data };
  return data;
}

function snapshot(data: ScheduleFile): ScheduleFile {
  return { resetAt: data.resetAt, overrides: { ...data.overrides } };
}

async function loadSchedule(): Promise<ScheduleFile> {
  const local = readLocal();
  const admin = getSupabaseAdmin();
  if (!admin) return remember(local);

  const { data, error } = await admin.from(TABLE).select('reset_at, overrides').eq('id', 1).maybeSingle();
  if (error) {
    if (isMissingTable(error)) return remember(local);
    throw new Error(error.message);
  }

  if (!data) {
    const seeded = await admin.from(TABLE).insert({
      id: 1,
      reset_at: local.resetAt,
      overrides: local.overrides
    });
    if (seeded.error && !/duplicate/i.test(seeded.error.message)) {
      if (isMissingTable(seeded.error)) return remember(local);
      throw new Error(seeded.error.message);
    }
    if (!seeded.error) return remember(local);

    const again = await admin.from(TABLE).select('reset_at, overrides').eq('id', 1).maybeSingle();
    if (again.error) throw new Error(again.error.message);
    return remember(again.data ? fromRow(again.data as ScheduleRow) : local);
  }

  return remember(fromRow(data as ScheduleRow));
}

async function readStored(): Promise<ScheduleFile> {
  if (cached && Date.now() - cached.at < CACHE_MS) return snapshot(cached.data);
  if (!inflight) {
    inflight = loadSchedule().finally(() => {
      inflight = null;
    });
  }
  return snapshot(await inflight);
}

async function writeStored(data: ScheduleFile): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    writeLocal(data);
    remember(data);
    return;
  }

  const { error } = await admin.from(TABLE).upsert({
    id: 1,
    reset_at: data.resetAt,
    overrides: data.overrides
  });
  if (error) {
    if (isMissingTable(error)) throw new Error(MISSING_TABLE);
    throw new Error(error.message);
  }
  remember(data);
}

export async function readSchedule(): Promise<ScheduleFile> {
  return readStored();
}

export async function overrideFor(date: PuzzleDate): Promise<ScheduledMovie | null> {
  return (await readStored()).overrides[date] ?? null;
}

export async function setOverride(date: PuzzleDate, movie: ScheduledMovie): Promise<void> {
  const data = await readStored();
  data.overrides[date] = movie;
  await writeStored(data);
}

export async function clearOverride(date: PuzzleDate): Promise<void> {
  const data = await readStored();
  delete data.overrides[date];
  await writeStored(data);
}
