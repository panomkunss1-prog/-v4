import { currentStandings } from './standingsQuery';
import { positionOf } from '../systems/league/standings';
import type { GameState } from './gameState';

/**
 * Blends league position and board confidence into a single 0..100 score
 * for the sponsorship system to price offers against. Before any match has
 * been played there is no position signal yet, so it falls back to board
 * confidence alone.
 */
export function performanceScore(state: GameState): number {
  const standings = currentStandings(state);
  const confidence = state.board.confidence;

  if (state.results.length === 0 || standings.length === 0) return confidence;

  const position = positionOf(standings, state.playerClubId);
  if (position === 0) return confidence;

  const positionScore = (1 - (position - 1) / Math.max(1, standings.length - 1)) * 100;
  return Math.round(positionScore * 0.7 + confidence * 0.3);
}
