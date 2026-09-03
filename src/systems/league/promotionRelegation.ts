import type { ClubId } from '../../core/ids';
import type { CompetitionRegulation } from '../../core/regulation';
import type { Standings } from '../../core/standings';
import { isEnforceable } from '../../core/regulation';

/**
 * LEAGUE SYSTEM — promotion and relegation.
 *
 * Every count comes from CompetitionRegulation. There is not a single
 * hard-coded "bottom three" in this file: change promotionSlots or
 * relegationSlots in regulations.data.ts and the pyramid moves differently
 * with no code edit (brief §8, and covered by tests).
 *
 * A slot whose regulation is UNKNOWN is treated as zero movement rather than
 * a guessed number (brief §17 uncertain-rules condition).
 */
export interface TierMovement {
  competitionId: string;
  promoted: ClubId[];
  relegated: ClubId[];
}

export interface PyramidMovement {
  movements: TierMovement[];
  /** Club id -> the competition it will play in next season. */
  nextCompetitionOf: Record<ClubId, string>;
}

function slots(rule: CompetitionRegulation['promotionSlots']): number {
  return isEnforceable(rule) && rule.value !== null ? rule.value : 0;
}

export function relegationSlotsOf(regulation: CompetitionRegulation): number {
  return slots(regulation.relegationSlots);
}

export function promotionSlotsOf(regulation: CompetitionRegulation): number {
  return slots(regulation.promotionSlots);
}

/** The bottom N of a completed table, worst-placed first. */
export function bottomClubs(standings: Standings, count: number): ClubId[] {
  if (count <= 0) return [];
  return standings.slice(-count).map((row) => row.clubId).reverse();
}

/** The top N of a completed table, champion first. */
export function topClubs(standings: Standings, count: number): ClubId[] {
  if (count <= 0) return [];
  return standings.slice(0, count).map((row) => row.clubId);
}

/**
 * Works the pyramid from the top down. Each tier's relegated clubs swap with
 * the tier below's promoted clubs, so every competition keeps the same club
 * count it started the season with.
 */
export function resolvePyramid(input: {
  /** Ordered top tier first, e.g. ['T1', 'T2', 'T3']. */
  competitionIds: readonly string[];
  /** Final table per competition. T3 supplies its champions-stage ranking. */
  standingsOf: Record<string, Standings>;
  regulationOf: Record<string, CompetitionRegulation>;
}): PyramidMovement {
  const { competitionIds, standingsOf, regulationOf } = input;
  const movements: TierMovement[] = [];
  const nextCompetitionOf: Record<ClubId, string> = {};

  for (const competitionId of competitionIds) {
    const standings = standingsOf[competitionId] ?? [];
    for (const row of standings) nextCompetitionOf[row.clubId] = competitionId;
  }

  for (let i = 0; i < competitionIds.length; i += 1) {
    const competitionId = competitionIds[i] as string;
    const below = competitionIds[i + 1];
    const regulation = regulationOf[competitionId];
    if (!regulation) continue;

    const standings = standingsOf[competitionId] ?? [];
    const relegated = below ? bottomClubs(standings, relegationSlotsOf(regulation)) : [];

    let promoted: ClubId[] = [];
    if (below) {
      const belowRegulation = regulationOf[below];
      const belowStandings = standingsOf[below] ?? [];
      if (belowRegulation) {
        promoted = topClubs(belowStandings, promotionSlotsOf(belowRegulation));
      }
      // Movement only holds if both sides can be filled, otherwise the club
      // counts would drift apart season on season.
      const exchange = Math.min(relegated.length, promoted.length);
      for (const clubId of relegated.slice(0, exchange)) nextCompetitionOf[clubId] = below;
      for (const clubId of promoted.slice(0, exchange)) nextCompetitionOf[clubId] = competitionId;
      movements.push({
        competitionId,
        promoted: promoted.slice(0, exchange),
        relegated: relegated.slice(0, exchange),
      });
    }
  }

  return { movements, nextCompetitionOf };
}

/**
 * T3's published format: the top two of each zone reach a 12-team champions
 * stage, and the top three of that stage go up. This returns the 12 qualifiers
 * in zone order; the caller plays the stage through the normal match pipeline.
 */
export function zoneQualifiers(
  zoneStandings: Record<string, Standings>,
  perZone = 2,
): ClubId[] {
  return Object.keys(zoneStandings)
    .sort()
    .flatMap((zone) => topClubs(zoneStandings[zone] ?? [], perZone));
}
