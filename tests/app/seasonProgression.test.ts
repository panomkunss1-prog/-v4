import { describe, expect, it } from 'vitest';
import { createCareer } from '../../src/app/newCareer';
import { advanceMatchday } from '../../src/app/advanceMatchday';
import { endSeason, startNextSeason } from '../../src/app/endSeason';
import { currentStandings } from '../../src/app/standingsQuery';
import { buildAttributes, type ChairmanProfile } from '../../src/core/chairman';
import { playersOfClub, type GameState } from '../../src/app/gameState';

const chairman: ChairmanProfile = {
  name: 'ทดสอบ ฤดูกาล',
  background: 'corporate_executive',
  personality: 'patient',
  goal: 'promotion',
  attributes: buildAttributes('corporate_executive', 'patient'),
};

/** Plays every remaining matchday of the current season. */
function playSeason(state: GameState): GameState {
  let current = state;
  while (current.season.status !== 'complete') {
    const result = advanceMatchday(current);
    if (!result.ok) throw new Error(result.error);
    current = result.value;
  }
  return current;
}

function rollOver(state: GameState): GameState {
  const outcome = endSeason(state);
  if (!outcome.ok) throw new Error(outcome.error);
  const next = startNextSeason(state, outcome.value);
  if (!next.ok) throw new Error(next.error);
  return next.value;
}

describe('ending a season', () => {
  it('refuses to end a season that is still running', () => {
    const state = createCareer(chairman, 'T1-01', 'season-a');
    expect(endSeason(state).ok).toBe(false);
  });

  it('produces a verdict, a final position and a pyramid movement', () => {
    const done = playSeason(createCareer(chairman, 'T1-01', 'season-a'));
    const outcome = endSeason(done);
    if (!outcome.ok) throw new Error(outcome.error);

    expect(outcome.value.finalPosition).toBeGreaterThanOrEqual(1);
    expect(outcome.value.finalPosition).toBeLessThanOrEqual(16);
    expect(outcome.value.verdict.verdicts.length).toBeGreaterThan(0);
    expect(outcome.value.movement.movements.length).toBeGreaterThan(0);
    expect(['promoted', 'relegated', 'stayed']).toContain(outcome.value.outcome);
  });

  it('moves exactly the configured number of clubs between T1 and T2', () => {
    const done = playSeason(createCareer(chairman, 'T1-01', 'season-a'));
    const outcome = endSeason(done);
    if (!outcome.ok) throw new Error(outcome.error);
    const t1 = outcome.value.movement.movements.find((m) => m.competitionId === 'T1');
    expect(t1?.relegated).toHaveLength(3);
    expect(t1?.promoted).toHaveLength(3);
  });

  it('relegates the clubs that actually finished bottom', () => {
    const done = playSeason(createCareer(chairman, 'T1-01', 'season-a'));
    const table = currentStandings(done);
    const outcome = endSeason(done);
    if (!outcome.ok) throw new Error(outcome.error);
    const bottomThree = table.slice(-3).map((r) => r.clubId).sort();
    const t1 = outcome.value.movement.movements.find((m) => m.competitionId === 'T1');
    expect([...(t1?.relegated ?? [])].sort()).toEqual(bottomThree);
  });
});

describe('starting the next season', () => {
  const first = playSeason(createCareer(chairman, 'T1-01', 'season-a'));
  const second = rollOver(first);

  it('advances the year and resets the table', () => {
    expect(second.year).toBe(first.year + 1);
    expect(second.results).toHaveLength(0);
    expect(second.season.currentMatchday).toBe(1);
    expect(second.season.status).toBe('in_progress');
    expect(currentStandings(second).every((r) => r.played === 0)).toBe(true);
  });

  it('writes the finished season into history', () => {
    expect(second.history).toHaveLength(1);
    const record = second.history[0]!;
    expect(record.year).toBe(first.year);
    expect(record.played).toBeGreaterThan(0);
    expect(['promoted', 'relegated', 'stayed']).toContain(record.outcome);
  });

  it('carries over money, sponsors and earned upgrades', () => {
    expect(second.finance.balance).toBe(first.finance.balance);
    expect(second.sponsors).toEqual(first.sponsors);
    expect(second.clubs[second.playerClubId]!.academy).toBe(
      first.clubs[first.playerClubId]!.academy,
    );
    expect(second.clubs[second.playerClubId]!.stadiumCapacity).toBe(
      first.clubs[first.playerClubId]!.stadiumCapacity,
    );
  });

  it('ages the squad by one year and keeps the same players', () => {
    const before = playersOfClub(first, first.playerClubId);
    const after = playersOfClub(second, second.playerClubId);
    expect(after).toHaveLength(before.length);
    for (const player of after) {
      const previous = before.find((p) => p.id === player.id)!;
      expect(player.age).toBe(previous.age + 1);
      expect(player.name).toBe(previous.name);
    }
  });

  it('generates a fresh fixture list for the new season', () => {
    expect(second.fixtures.length).toBeGreaterThan(0);
    expect(second.fixtures.every((f) => f.status === 'scheduled')).toBe(true);
  });

  it('keeps every tier at a stable club count across the rollover', () => {
    expect(second.leagueMembership.T1).toHaveLength(16);
    expect(second.leagueMembership.T2).toHaveLength(18);
    expect(second.leagueMembership.T3).toHaveLength(69);
  });

  it('never lets a club sit in two competitions at once', () => {
    const all = Object.values(second.leagueMembership).flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it('is playable: the new season can be advanced', () => {
    const result = advanceMatchday(second);
    expect(result.ok).toBe(true);
  });
});

describe('playing several seasons back to back', () => {
  it('runs three full seasons without breaking', () => {
    let state = createCareer(chairman, 'T1-01', 'multi-season');
    const years: number[] = [];
    for (let i = 0; i < 3; i += 1) {
      state = playSeason(state);
      years.push(state.year);
      state = rollOver(state);
    }
    expect(years).toEqual([2026, 2027, 2028]);
    expect(state.year).toBe(2029);
    expect(state.history).toHaveLength(3);
    expect(state.leagueMembership.T1).toHaveLength(16);
    expect(state.leagueMembership.T2).toHaveLength(18);
    expect(state.leagueMembership.T3).toHaveLength(69);
  });

  it('is deterministic across the whole multi-season run', () => {
    const run = () => {
      let state = createCareer(chairman, 'T1-01', 'determinism');
      for (let i = 0; i < 2; i += 1) state = rollOver(playSeason(state));
      return state;
    };
    const a = run();
    const b = run();
    expect(a.history).toEqual(b.history);
    expect(a.leagueMembership).toEqual(b.leagueMembership);
  });
});

describe('a T3 zone career', () => {
  it('plays its zone and can roll into a new season', () => {
    let state = createCareer(chairman, 'T3-01', 'zone-career');
    expect(state.season.zone).toBeTruthy();
    state = playSeason(state);
    const next = rollOver(state);
    expect(next.year).toBe(state.year + 1);
    expect(next.season.participantIds.length).toBeGreaterThanOrEqual(10);
    expect(next.leagueMembership.T3).toHaveLength(69);
  });
});

describe('pyramid integrity over a long career', () => {
  it('keeps every tier intact and every club in exactly one place over 6 seasons', () => {
    let state = createCareer(chairman, 'T1-01', 'long-career');
    for (let i = 0; i < 6; i += 1) {
      state = rollOver(playSeason(state));
      expect(state.leagueMembership.T1).toHaveLength(16);
      expect(state.leagueMembership.T2).toHaveLength(18);
      expect(state.leagueMembership.T3).toHaveLength(69);
      const all = Object.values(state.leagueMembership).flat();
      expect(new Set(all).size).toBe(103);
    }
    expect(state.year).toBe(2032);
    expect(state.history).toHaveLength(6);
  });

  it('actually moves clubs between tiers rather than keeping a frozen pyramid', () => {
    const start = createCareer(chairman, 'T1-01', 'movement-check');
    let state = start;
    for (let i = 0; i < 3; i += 1) state = rollOver(playSeason(state));
    expect(state.leagueMembership.T1).not.toEqual(start.leagueMembership.T1);
  });

  it('keeps the player club in whichever tier the outcome says', () => {
    let state = createCareer(chairman, 'T1-01', 'player-tier');
    for (let i = 0; i < 4; i += 1) {
      const done = playSeason(state);
      const outcome = endSeason(done);
      if (!outcome.ok) throw new Error(outcome.error);
      const next = startNextSeason(done, outcome.value);
      if (!next.ok) throw new Error(next.error);
      state = next.value;
      expect(state.season.competitionId).toBe(outcome.value.nextCompetitionId);
      expect(state.leagueMembership[state.season.competitionId]).toContain(state.playerClubId);
      expect(state.season.participantIds).toContain(state.playerClubId);
    }
  });
});
