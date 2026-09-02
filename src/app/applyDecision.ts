import type { DecisionParams, DecisionType, ExecutiveDecision } from '../core/decision';
import { err, ok, type Result } from '../core/result';
import { decide } from '../systems/executive/decisions';
import type { GameState } from './gameState';
import { playerClub } from './gameState';

/**
 * Orchestrates one executive decision: asks the executive system for the
 * outcome, then writes each piece of state back to its OWNING system's slice.
 * The UI calls this; it never edits finance/board/club state itself.
 */
export function applyDecision(
  state: GameState,
  type: DecisionType,
  params: DecisionParams,
): Result<GameState> {
  const club = playerClub(state);
  const outcome = decide(
    type,
    {
      club,
      chairman: state.chairman,
      finance: state.finance,
      board: state.board,
      fans: state.fans,
      matchday: state.season.currentMatchday,
    },
    params,
  );

  if (!outcome.ok) return err(outcome.error);

  const record: ExecutiveDecision = {
    id: `D${state.decisions.length + 1}`,
    type,
    params,
    appliedOnMatchday: state.season.currentMatchday,
    cost: outcome.value.cost,
    summary: outcome.value.summary,
    effects: outcome.value.effects,
  };

  return ok({
    ...state,
    clubs: { ...state.clubs, [club.id]: outcome.value.club },
    finance: outcome.value.finance,
    board: outcome.value.board,
    fans: outcome.value.fans,
    decisions: [...state.decisions, record],
  });
}
