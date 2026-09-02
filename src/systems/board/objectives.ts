import type { BoardObjective, BoardState, FanState } from '../../core/board';
import type { Club } from '../../core/club';
import type { ChairmanGoal } from '../../core/chairman';
import { clamp } from '../../core/result';

/** BOARD SYSTEM owns board confidence, patience and objectives. */
export function defaultObjectives(club: Club, goal: ChairmanGoal): BoardObjective[] {
  const objectives: BoardObjective[] = [];
  const midTable = club.tier === 1 ? 9 : club.tier === 2 ? 10 : 6;

  if (goal === 'win_title') {
    objectives.push({ type: 'league_position', description: 'จบฤดูกาลใน 3 อันดับแรก', target: 3 });
  } else if (goal === 'promotion') {
    objectives.push({ type: 'league_position', description: 'จบฤดูกาลใน 5 อันดับแรก', target: 5 });
  } else {
    objectives.push({
      type: 'league_position',
      description: `จบฤดูกาลไม่ต่ำกว่าอันดับ ${midTable}`,
      target: midTable,
    });
  }

  objectives.push({
    type: 'financial_stability',
    description: 'รักษาสถานะการเงินไม่ให้ติดลบ',
    target: 0,
  });

  if (goal === 'build_academy') {
    objectives.push({ type: 'youth_development', description: 'ยกระดับอะคาเดมีให้ถึง 12', target: 12 });
  }
  return objectives;
}

export function initialBoardState(club: Club, goal: ChairmanGoal): BoardState {
  return {
    objectives: defaultObjectives(club, goal),
    confidence: 60,
    patience: 60,
  };
}

export function initialFanState(): FanState {
  return { mood: 60 };
}

/** Results move board confidence and fan mood. Only this system does that. */
export function applyResultToBoard(
  board: BoardState,
  fans: FanState,
  outcome: 'win' | 'draw' | 'loss',
): { board: BoardState; fans: FanState } {
  const confidenceDelta = outcome === 'win' ? 4 : outcome === 'draw' ? 0 : -4;
  const moodDelta = outcome === 'win' ? 5 : outcome === 'draw' ? -1 : -6;
  return {
    board: { ...board, confidence: clamp(board.confidence + confidenceDelta, 0, 100) },
    fans: { mood: clamp(fans.mood + moodDelta, 0, 100) },
  };
}
