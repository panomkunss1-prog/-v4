import { describe, expect, it } from 'vitest';
import { advanceMatchday } from '../../src/app/advanceMatchday';
import { createCareer } from '../../src/app/newCareer';
import { currentStandings } from '../../src/app/standingsQuery';
import { buildAttributes } from '../../src/core/chairman';
import type { ChairmanProfile } from '../../src/core/chairman';
import { T1_CLUBS } from '../../src/data/clubs.seed';
import { resultsForMatchday } from '../../src/app/gameState';
import type { GameState } from '../../src/app/gameState';

const chairman: ChairmanProfile = {
  name: 'ทดสอบ นัดแข่ง',
  background: 'corporate_executive',
  personality: 'patient',
  goal: 'win_title',
  attributes: buildAttributes('corporate_executive', 'patient'),
};

const fresh = () => createCareer(chairman, T1_CLUBS[0]!.id, 'matchday-seed');

const step = (state: GameState): GameState => {
  const result = advanceMatchday(state);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

describe('advancing a matchday', () => {
  it('plays every fixture in the round exactly once', () => {
    const after = step(fresh());
    expect(after.results).toHaveLength(8);
    expect(resultsForMatchday(after, 1)).toHaveLength(8);
    expect(after.fixtures.filter((f) => f.status === 'played')).toHaveLength(8);
  });

  it('advances the matchday counter', () => {
    const after = step(fresh());
    expect(after.season.currentMatchday).toBe(2);
    expect(after.lastMatchday).toBe(1);
  });

  it('updates the league table so clubs move off zero', () => {
    const before = fresh();
    expect(currentStandings(before).every((r) => r.points === 0)).toBe(true);

    const after = step(before);
    const table = currentStandings(after);
    expect(table).toHaveLength(16);
    expect(table.every((r) => r.played === 1)).toBe(true);
    // 8 matches award either 3 (decisive) or 2 (draw) points in total.
    const totalPoints = table.reduce((s, r) => s + r.points, 0);
    expect(totalPoints).toBeLessThanOrEqual(24);
    expect(totalPoints).toBeGreaterThanOrEqual(16);
    expect(table.some((r) => r.points > 0)).toBe(true);
  });

  it('keeps the table consistent with results over ten matchdays', () => {
    let state = fresh();
    for (let i = 0; i < 10; i += 1) state = step(state);
    const table = currentStandings(state);
    expect(table.every((r) => r.played === 10)).toBe(true);
    const goalsFor = table.reduce((s, r) => s + r.goalsFor, 0);
    const goalsAgainst = table.reduce((s, r) => s + r.goalsAgainst, 0);
    expect(goalsFor).toBe(goalsAgainst);
    expect(state.results).toHaveLength(80);
  });

  it('applies finance consequences to the player club each matchday', () => {
    const before = fresh();
    const after = step(before);
    expect(after.finance.ledger.length).toBeGreaterThan(0);
    expect(after.finance.ledger.some((e) => e.category === 'wages')).toBe(true);
    expect(after.finance.balance).not.toBe(before.finance.balance);
  });

  it('moves board confidence or fan mood after the club plays', () => {
    const before = fresh();
    const after = step(before);
    const moved =
      after.board.confidence !== before.board.confidence || after.fans.mood !== before.fans.mood;
    expect(moved).toBe(true);
  });

  it('is deterministic: the same career replays identically', () => {
    const a = step(step(fresh()));
    const b = step(step(fresh()));
    expect(a.results).toEqual(b.results);
    expect(a.finance.balance).toBe(b.finance.balance);
  });

  it('completes the season after the final matchday and refuses to go further', () => {
    let state = fresh();
    for (let i = 0; i < 30; i += 1) state = step(state);
    expect(state.season.status).toBe('complete');
    expect(state.results).toHaveLength(240);
    expect(currentStandings(state).every((r) => r.played === 30)).toBe(true);

    const beyond = advanceMatchday(state);
    expect(beyond.ok).toBe(false);
  });

  it('does not mutate the previous state', () => {
    const before = fresh();
    step(before);
    expect(before.results).toHaveLength(0);
    expect(before.season.currentMatchday).toBe(1);
  });
});
