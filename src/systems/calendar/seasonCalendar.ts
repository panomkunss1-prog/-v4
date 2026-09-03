import type { GameDate } from '../../core/gameDate';
import { addDays } from '../../core/gameDate';

/**
 * CALENDAR SYSTEM. Maps a matchday index onto a GameDate.
 *
 * These are SIMULATION dates: a fixed synthetic season-open anchor plus a
 * weekly cadence between matchdays. They are NOT sourced real-world fixture
 * dates and must never be presented as an official schedule — the research
 * documents already in this project (docs/research/) are explicit that a
 * real announced calendar has not been verified, and this module invents no
 * such claim. Every screen that shows a GameDate must make clear it is a
 * simulated in-game date.
 *
 * Pure and deterministic: the same (seasonYear, matchday) always produces the
 * same date, with no RNG and no dependency on state beyond its inputs — so it
 * is cheap to recompute on demand rather than persisted (same pattern as
 * standings in systems/league/standings.ts).
 */
const SEASON_ANCHOR_MONTH = 8; // August — arbitrary synthetic season-open month.
const SEASON_ANCHOR_DAY = 1;
const DAYS_BETWEEN_MATCHDAYS = 7;

/** The synthetic date matchday 1 of a season falls on. */
export function seasonAnchorDate(seasonYear: number): GameDate {
  return { year: seasonYear, month: SEASON_ANCHOR_MONTH, day: SEASON_ANCHOR_DAY };
}

export function dateForMatchday(seasonYear: number, matchday: number): GameDate {
  return addDays(seasonAnchorDate(seasonYear), (matchday - 1) * DAYS_BETWEEN_MATCHDAYS);
}

/**
 * "Today" before a single matchday has been resolved — the eve of the
 * season opener. Used as the resting currentDate at career/season start, so
 * the FIRST NEXT press also visibly advances the date (it moves onto the
 * opener and resolves it), not just the second one onward.
 */
export function preseasonDate(seasonYear: number): GameDate {
  return addDays(seasonAnchorDate(seasonYear), -1);
}
