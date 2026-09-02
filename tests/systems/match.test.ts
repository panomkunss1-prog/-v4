import { describe, expect, it } from 'vitest';
import { simulateMatch, type MatchSide } from '../../src/systems/match/simulateMatch';
import { selectTeam } from '../../src/systems/match/teamSelection';
import { createRng } from '../../src/core/rng';
import { getRegulation } from '../../src/data/regulations.data';
import { generateSquad } from '../../src/data/players.seed';
import { generateManager } from '../../src/data/managers.seed';
import { T1_CLUBS } from '../../src/data/clubs.seed';
import type { Match } from '../../src/core/match';

const reg = getRegulation('T1');
const strong = T1_CLUBS[0]!;
const weak = T1_CLUBS[15]!;

function side(club = strong, seed = 1): MatchSide {
  const rng = createRng(seed);
  return {
    club,
    manager: generateManager(club, rng),
    squad: generateSquad(club, rng, reg.foreignRegistrationMax.value),
  };
}

const fixture: Match = {
  id: 'M1',
  seasonId: 'S',
  matchday: 1,
  homeClubId: strong.id,
  awayClubId: weak.id,
  status: 'scheduled',
};

describe('match simulation', () => {
  it('is fully deterministic for the same seed', () => {
    const a = simulateMatch(fixture, side(strong, 1), side(weak, 2), reg, createRng(500));
    const b = simulateMatch(fixture, side(strong, 1), side(weak, 2), reg, createRng(500));
    expect(a).toEqual(b);
  });

  it('produces different results for different seeds', () => {
    const scores = new Set(
      Array.from({ length: 20 }, (_, i) =>
        JSON.stringify(
          (() => {
            const r = simulateMatch(fixture, side(strong, 1), side(weak, 2), reg, createRng(i));
            return [r.homeGoals, r.awayGoals];
          })(),
        ),
      ),
    );
    expect(scores.size).toBeGreaterThan(1);
  });

  it('always returns non-negative integer goals in a plausible range', () => {
    for (let i = 0; i < 200; i += 1) {
      const r = simulateMatch(fixture, side(strong, 1), side(weak, 2), reg, createRng(i));
      for (const goals of [r.homeGoals, r.awayGoals]) {
        expect(Number.isInteger(goals)).toBe(true);
        expect(goals).toBeGreaterThanOrEqual(0);
        expect(goals).toBeLessThanOrEqual(14);
      }
    }
  });

  it('emits exactly one scorer id per goal', () => {
    for (let i = 0; i < 50; i += 1) {
      const r = simulateMatch(fixture, side(strong, 1), side(weak, 2), reg, createRng(i));
      expect(r.scorerIds).toHaveLength(r.homeGoals + r.awayGoals);
    }
  });

  it('gives the stronger club more points across a large sample', () => {
    let strongPoints = 0;
    let weakPoints = 0;
    for (let i = 0; i < 400; i += 1) {
      const r = simulateMatch(fixture, side(strong, 1), side(weak, 2), reg, createRng(i * 31));
      if (r.homeGoals > r.awayGoals) strongPoints += 3;
      else if (r.homeGoals < r.awayGoals) weakPoints += 3;
      else {
        strongPoints += 1;
        weakPoints += 1;
      }
    }
    expect(strongPoints).toBeGreaterThan(weakPoints);
  });

  it('carries a read-only manager rationale for BOTH sides, never a lineup control', () => {
    const r = simulateMatch(fixture, side(strong, 1), side(weak, 2), reg, createRng(9));
    expect(r.homeManagerRationale.length).toBeGreaterThan(0);
    expect(r.awayManagerRationale.length).toBeGreaterThan(0);
    // Each chairman must read their OWN manager, not the opponent's.
    expect(r.homeManagerRationale).not.toBe(r.awayManagerRationale);
    expect(Object.keys(r)).not.toContain('lineup');
    expect(Object.keys(r)).not.toContain('formation');
  });
});

describe('NPC team selection', () => {
  it('always fields exactly 11 players', () => {
    const s = side(strong, 4);
    expect(selectTeam(s.squad, s.manager, reg).starters).toHaveLength(11);
  });

  it('respects the T1 foreign matchday cap of 7', () => {
    const s = side(strong, 4);
    const starters = selectTeam(s.squad, s.manager, reg).starters;
    expect(starters.filter((p) => p.isForeign).length).toBeLessThanOrEqual(7);
  });

  it('never selects the same player twice', () => {
    const s = side(strong, 8);
    const starters = selectTeam(s.squad, s.manager, reg).starters;
    expect(new Set(starters.map((p) => p.id)).size).toBe(11);
  });

  it('fields exactly one goalkeeper', () => {
    const s = side(strong, 12);
    const starters = selectTeam(s.squad, s.manager, reg).starters;
    expect(starters.filter((p) => p.position === 'GK')).toHaveLength(1);
  });
});
