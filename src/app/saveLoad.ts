import { dateForMatchday, preseasonDate } from '../systems/calendar/seasonCalendar';
import type { GameState } from './gameState';

/**
 * Persistence lives in APP, never in UI. Keys are namespaced `tfe:` so this
 * prototype can never collide with the legacy debt tracker's localStorage.
 */
export const SAVE_KEY = 'tfe:career:v1';

export function saveCareer(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // A full or unavailable localStorage must not break the running session.
  }
}

/**
 * A save written before the game clock existed has no `currentDate`/`inbox`.
 * Backfills both deterministically from data the save already has, so an
 * older save loads cleanly instead of crashing — no data is lost or altered.
 * Exported separately so this logic is unit-testable without a real
 * localStorage/DOM environment.
 */
export function migrateSave(state: GameState): GameState {
  if (state.currentDate && Array.isArray(state.inbox)) return state;

  // "Today" is the date of the last matchday actually resolved, matching the
  // invariant the live game clock keeps — or the eve of the opener if none
  // has been played yet this season.
  const lastPlayedMatchday =
    state.season.status === 'complete'
      ? state.season.totalMatchdays
      : state.season.currentMatchday - 1;

  return {
    ...state,
    currentDate:
      state.currentDate ??
      (lastPlayedMatchday >= 1
        ? dateForMatchday(state.year, lastPlayedMatchday)
        : preseasonDate(state.year)),
    inbox: Array.isArray(state.inbox) ? state.inbox : [],
  };
}

export function loadCareer(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed?.playerClubId || !parsed?.season) return null;
    return migrateSave(parsed);
  } catch {
    return null;
  }
}

export function clearCareer(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
