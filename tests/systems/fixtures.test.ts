import { describe, expect, it } from 'vitest';
import { generateFixtures, matchesForMatchday, totalMatchdays } from '../../src/systems/league/fixtures';
import { createRng } from '../../src/core/rng';

const clubs16 = Array.from({ length: 16 }, (_, i) => `C${i + 1}`);

describe('fixture generation', () => {
  it('produces a full double round-robin for 16 clubs', () => {
    const fixtures = generateFixtures('S', clubs16, createRng(1));
    // 16 clubs -> each plays 30 matches -> 240 fixtures.
    expect(fixtures).toHaveLength(240);
    expect(totalMatchdays(16)).toBe(30);
  });

  it('gives every club exactly one match on every matchday', () => {
    const fixtures = generateFixtures('S', clubs16, createRng(7));
    for (let day = 1; day <= 30; day += 1) {
      const dayMatches = matchesForMatchday(fixtures, day);
      expect(dayMatches).toHaveLength(8);
      const appearing = dayMatches.flatMap((m) => [m.homeClubId, m.awayClubId]);
      expect(new Set(appearing).size).toBe(16);
    }
  });

  it('has every pair meet exactly twice, once at each ground', () => {
    const fixtures = generateFixtures('S', clubs16, createRng(3));
    const pairCounts = new Map<string, number>();
    for (const m of fixtures) {
      const key = `${m.homeClubId}>${m.awayClubId}`;
      pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
    }
    // 16*15 = 240 ordered pairs, each occurring exactly once.
    expect(pairCounts.size).toBe(240);
    expect([...pairCounts.values()].every((c) => c === 1)).toBe(true);
  });

  it('never schedules a club against itself', () => {
    const fixtures = generateFixtures('S', clubs16, createRng(11));
    expect(fixtures.some((m) => m.homeClubId === m.awayClubId)).toBe(false);
  });

  it('handles an 18-club competition (T2 shape)', () => {
    const clubs18 = Array.from({ length: 18 }, (_, i) => `D${i + 1}`);
    const fixtures = generateFixtures('S2', clubs18, createRng(5));
    expect(fixtures).toHaveLength(18 * 17);
    expect(totalMatchdays(18)).toBe(34);
  });

  it('is reproducible from the same seed', () => {
    const a = generateFixtures('S', clubs16, createRng(42));
    const b = generateFixtures('S', clubs16, createRng(42));
    expect(a).toEqual(b);
  });
});
