import type { Standings } from '../core/standings';
import { computeStandings } from '../systems/league/standings';
import { getRegulation } from '../data/regulations.data';
import type { GameState } from './gameState';

/**
 * Read-only projection for the UI. The league system computes the table; this
 * only wires the state into it, so the UI never calculates standings (D1).
 */
export function currentStandings(state: GameState): Standings {
  return computeStandings(
    state.season.participantIds,
    state.results,
    getRegulation(state.season.competitionId),
  );
}
