import type { ClubId } from '../core/ids';
import type { Club } from '../core/club';
import type { Standings } from '../core/standings';
import type { Match } from '../core/match';
import { createRng } from '../core/rng';
import { getClub } from '../data/clubs.seed';
import { getRegulation } from '../data/regulations.data';
import { isZonedCompetition, zoneForClub } from './../data/competitions.data';
import { generateManager } from '../data/managers.seed';
import { generateSquad } from '../data/players.seed';
import { generateFixtures } from '../systems/league/fixtures';
import { computeStandings } from '../systems/league/standings';
import { simulateMatch, type MatchSide } from '../systems/match/simulateMatch';
import { zoneQualifiers } from '../systems/league/promotionRelegation';

/**
 * Resolves a competition the player is NOT in, so the pyramid can move
 * around them at season end.
 *
 * These clubs are rebuilt from the career seed on demand rather than carried
 * in the save: membership is the only cross-tier state that persists, which
 * keeps a save to the player's own competition while still producing real
 * tables elsewhere.
 *
 * Every match still goes through the ONE simulateMatch pipeline — this is a
 * bulk caller of it, never a second implementation (duplicate risk D2).
 */
function simulateTable(
  competitionId: string,
  clubIds: readonly ClubId[],
  seed: number,
  seasonId: string,
): Standings {
  if (clubIds.length < 2) return [];
  const regulation = getRegulation(competitionId);
  const rng = createRng(seed);

  const clubs: Record<ClubId, Club> = {};
  const sides: Record<ClubId, MatchSide> = {};
  for (const clubId of clubIds) {
    const club = getClub(clubId);
    clubs[clubId] = club;
    const manager = generateManager(club, rng);
    const squad = generateSquad(club, rng, regulation.foreignRegistrationMax.value);
    sides[clubId] = { club, manager, squad };
  }

  const fixtures: Match[] = generateFixtures(seasonId, clubIds, rng);
  const results = fixtures.map((fixture) =>
    simulateMatch(
      fixture,
      sides[fixture.homeClubId] as MatchSide,
      sides[fixture.awayClubId] as MatchSide,
      regulation,
      rng,
    ),
  );

  return computeStandings(clubIds, results, regulation);
}

export interface ResolvedCompetition {
  competitionId: string;
  /** Single table, or the champions-stage ranking for a zoned competition. */
  standings: Standings;
  /** Per-zone tables, for a zoned competition. */
  zoneStandings: Record<string, Standings>;
}

/**
 * A zoned competition plays regional groups, then its published format sends
 * the top two of each zone into a champions stage whose top places go up.
 * The stage is played through the same pipeline as everything else.
 */
export function resolveZonedCompetition(
  competitionId: string,
  clubIds: readonly ClubId[],
  seed: number,
  year: number,
): ResolvedCompetition {
  const byZone: Record<string, ClubId[]> = {};
  clubIds.forEach((clubId, index) => {
    const zone = zoneForClub(competitionId, getClub(clubId).zone, index);
    (byZone[zone] ??= []).push(clubId);
  });

  const zoneStandings: Record<string, Standings> = {};
  let offset = 0;
  for (const zone of Object.keys(byZone).sort()) {
    offset += 1;
    zoneStandings[zone] = simulateTable(
      competitionId,
      byZone[zone] as ClubId[],
      seed + year * 104729 + offset * 7919,
      `${competitionId}-${year}-${offset}`,
    );
  }

  const qualifiers = zoneQualifiers(zoneStandings);
  const standings = simulateTable(
    competitionId,
    qualifiers,
    seed + year * 104729 + 99991,
    `${competitionId}-${year}-CL`,
  );

  return { competitionId, standings, zoneStandings };
}

export function resolveCompetition(
  competitionId: string,
  clubIds: readonly ClubId[],
  seed: number,
  year: number,
): ResolvedCompetition {
  if (isZonedCompetition(competitionId)) {
    return resolveZonedCompetition(competitionId, clubIds, seed, year);
  }
  return {
    competitionId,
    standings: simulateTable(
      competitionId,
      clubIds,
      seed + year * 104729,
      `${competitionId}-${year}`,
    ),
    zoneStandings: {},
  };
}
