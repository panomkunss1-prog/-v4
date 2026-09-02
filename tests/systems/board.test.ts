import { describe, expect, it } from 'vitest';
import { applyResultToBoard, defaultObjectives, initialBoardState, initialFanState } from '../../src/systems/board/objectives';
import { T1_CLUBS } from '../../src/data/clubs.seed';

const club = T1_CLUBS[0]!;

describe('board and fans', () => {
  it('derives objectives from the chairman goal', () => {
    expect(defaultObjectives(club, 'win_title')[0]?.target).toBe(3);
    expect(defaultObjectives(club, 'promotion')[0]?.target).toBe(5);
    expect(defaultObjectives(club, 'build_academy').some((o) => o.type === 'youth_development')).toBe(true);
  });

  it('always includes a financial stability objective', () => {
    for (const goal of ['promotion', 'build_academy', 'turn_profit', 'win_title'] as const) {
      expect(defaultObjectives(club, goal).some((o) => o.type === 'financial_stability')).toBe(true);
    }
  });

  it('raises confidence and mood on a win, lowers both on a loss', () => {
    const board = initialBoardState(club, 'promotion');
    const fans = initialFanState();
    const win = applyResultToBoard(board, fans, 'win');
    const loss = applyResultToBoard(board, fans, 'loss');
    expect(win.board.confidence).toBeGreaterThan(board.confidence);
    expect(win.fans.mood).toBeGreaterThan(fans.mood);
    expect(loss.board.confidence).toBeLessThan(board.confidence);
    expect(loss.fans.mood).toBeLessThan(fans.mood);
  });

  it('clamps confidence and mood to 0..100', () => {
    let state = { board: { ...initialBoardState(club, 'promotion'), confidence: 2 }, fans: { mood: 2 } };
    for (let i = 0; i < 10; i += 1) state = applyResultToBoard(state.board, state.fans, 'loss');
    expect(state.board.confidence).toBeGreaterThanOrEqual(0);
    expect(state.fans.mood).toBeGreaterThanOrEqual(0);

    let high = { board: { ...initialBoardState(club, 'promotion'), confidence: 98 }, fans: { mood: 98 } };
    for (let i = 0; i < 10; i += 1) high = applyResultToBoard(high.board, high.fans, 'win');
    expect(high.board.confidence).toBeLessThanOrEqual(100);
    expect(high.fans.mood).toBeLessThanOrEqual(100);
  });
});
