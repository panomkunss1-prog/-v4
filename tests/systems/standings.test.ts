import { describe, expect, it } from 'vitest';
import { computeStandings, positionOf } from '../../src/systems/league/standings';
import { getRegulation } from '../../src/data/regulations.data';
import type { MatchResult } from '../../src/core/match';

const reg = getRegulation('T1');

const result = (
  home: string,
  away: string,
  hg: number,
  ag: number,
  id = `${home}-${away}`,
): MatchResult => ({
  matchId: id,
  homeClubId: home,
  awayClubId: away,
  homeGoals: hg,
  awayGoals: ag,
  scorerIds: [],
  homeManagerRationale: '',
  awayManagerRationale: '',
});

describe('standings', () => {
  const clubs = ['A', 'B', 'C', 'D'];

  it('starts everyone on zero with no results', () => {
    const table = computeStandings(clubs, [], reg);
    expect(table).toHaveLength(4);
    expect(table.every((r) => r.points === 0 && r.played === 0)).toBe(true);
  });

  it('awards points from the regulation, not a hard-coded constant', () => {
    const table = computeStandings(clubs, [result('A', 'B', 2, 0), result('C', 'D', 1, 1)], reg);
    expect(table.find((r) => r.clubId === 'A')?.points).toBe(reg.pointsForWin);
    expect(table.find((r) => r.clubId === 'C')?.points).toBe(reg.pointsForDraw);
    expect(table.find((r) => r.clubId === 'B')?.points).toBe(0);
  });

  it('accumulates played, won, drawn, lost and goals correctly', () => {
    const table = computeStandings(
      clubs,
      [result('A', 'B', 3, 1), result('C', 'A', 2, 2), result('A', 'D', 0, 1)],
      reg,
    );
    const a = table.find((r) => r.clubId === 'A');
    expect(a).toMatchObject({
      played: 3,
      won: 1,
      drawn: 1,
      lost: 1,
      goalsFor: 5,
      goalsAgainst: 4,
      goalDifference: 1,
      points: 4,
    });
  });

  it('orders by points, then goal difference, then goals scored', () => {
    // A and B both finish on 3 points; A has the better goal difference.
    const table = computeStandings(
      ['A', 'B', 'C', 'D'],
      [result('A', 'C', 5, 0), result('B', 'D', 1, 0)],
      reg,
    );
    expect(table[0]?.clubId).toBe('A');
    expect(table[1]?.clubId).toBe('B');
    expect(positionOf(table, 'A')).toBe(1);
  });

  it('breaks a full points+GD tie on goals scored', () => {
    const table = computeStandings(
      ['A', 'B', 'C', 'D'],
      [result('A', 'C', 3, 1), result('B', 'D', 2, 0)],
      reg,
    );
    // Both +2; A scored 3, B scored 2.
    expect(table[0]?.clubId).toBe('A');
  });

  it('assigns contiguous positions from 1', () => {
    const table = computeStandings(clubs, [result('A', 'B', 1, 0)], reg);
    expect(table.map((r) => r.position)).toEqual([1, 2, 3, 4]);
  });

  it('ignores results for clubs outside the competition', () => {
    const table = computeStandings(clubs, [result('X', 'Y', 4, 0)], reg);
    expect(table.every((r) => r.played === 0)).toBe(true);
  });
});
