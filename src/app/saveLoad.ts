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

export function loadCareer(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed?.playerClubId || !parsed?.season) return null;
    return parsed;
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
