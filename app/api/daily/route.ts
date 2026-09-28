import { NextResponse } from 'next/server';
import { puzzleNumber, todayUTC } from '@/app/lib/dates';
import { readSchedule } from '@/app/lib/schedule';
import { isTmdbConfigured } from '@/app/lib/tmdb';
import type { DailyInfo } from '@/app/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const today = todayUTC();
  const info: DailyInfo = {
    date: today,
    puzzleNumber: puzzleNumber(today),
    tmdbConfigured: isTmdbConfigured(),
    resetAt: (await readSchedule()).resetAt
  };
  return NextResponse.json(info);
}