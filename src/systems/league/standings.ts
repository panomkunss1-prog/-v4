import type { ClubId } from '../../core/ids';
import type { MatchResult } from '../../core/match';
import type { Standings, StandingsRow } from '../../core/standings';
import type { CompetitionRegulation } from '../../core/regulation';

/**
 * LEAGUE SYSTEM is the sole producer of Standings (duplicate risk D1).
 * Standings are DERIVED from results on every read and never persisted, so a
 * save file can never disagree with the table (duplicate risk D6).
 *
 * Ordering: points, then goal difference, then goals for, then club id for a
 * stable deterministic sort.
 */
export function computeStandings(
  clubIds: readonly ClubId[],
  results: readonly MatchResult[],
  regulation: CompetitionRegulation,
): Standings {
  const rows = new Map<ClubId, StandingsRow>();
  for (const clubId of clubIds) {
    rows.set(clubId, {
      clubId,
      position: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const result of results) {
    const home = rows.get(result.homeClubId);
    const away = rows.get(result.awayClubId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += result.homeGoals;
    home.goalsAgainst += result.awayGoals;
    away.goalsFor += result.awayGoals;
    away.goalsAgainst += result.homeGoals;

    if (result.homeGoals > result.awayGoals) {
      home.won += 1;
      away.lost += 1;
      home.points += regulation.pointsForWin;
    } else if (result.homeGoals < result.awayGoals) {
      away.won += 1;
      home.lost += 1;
      away.points += regulation.pointsForWin;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += regulation.pointsForDraw;
      away.points += regulation.pointsForDraw;
    }
  }

  const table = [...rows.values()];
  for (const row of table) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  table.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.clubId.localeCompare(b.clubId),
  );

  table.forEach((row, index) => {
    row.position = index + 1;
  });

  return table;
}

export function positionOf(standings: Standings, clubId: ClubId): number {
  return standings.find((row) => row.clubId === clubId)?.position ?? 0;
}
