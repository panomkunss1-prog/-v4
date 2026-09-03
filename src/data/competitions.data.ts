import type { Competition } from '../core/competition';

/**
 * Brief §3 baseline structure. Club counts are the verified baseline; the
 * actual participants are fictional (see clubs.seed.ts).
 */
export const T3_ZONES = [
  'ภาคเหนือ',
  'ภาคตะวันออกเฉียงเหนือ',
  'ภาคตะวันออก',
  'ภาคตะวันตก',
  'ภาคใต้',
  'กรุงเทพและปริมณฑล',
] as const;

export const COMPETITIONS: Competition[] = [
  {
    id: 'T1',
    name: 'ไทยลีก 1',
    shortName: 'T1',
    tier: 1,
    zones: [],
    expectedClubCount: 16,
  },
  {
    id: 'T2',
    name: 'ไทยลีก 2',
    shortName: 'T2',
    tier: 2,
    zones: [],
    expectedClubCount: 18,
  },
  {
    id: 'T3',
    name: 'ไทยลีก 3',
    shortName: 'T3',
    tier: 3,
    zones: [...T3_ZONES],
    expectedClubCount: 69,
  },
];

export function getCompetition(id: string): Competition {
  const found = COMPETITIONS.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown competition: ${id}`);
  return found;
}

/**
 * Whether a competition is played as regional zones. This is a property of
 * the COMPETITION, never of the clubs in it: a club promoted out of a zoned
 * tier still carries its old zone field, so asking the clubs would wrongly
 * mark the tier above as zoned once anyone comes up.
 */
export function isZonedCompetition(competitionId: string): boolean {
  return getCompetition(competitionId).zones.length > 0;
}

/**
 * The zone a club plays in for a given competition. A club arriving from
 * another tier keeps its own zone when it has one; otherwise it is placed
 * deterministically so the groups stay balanced.
 */
export function zoneForClub(
  competitionId: string,
  clubZone: string | undefined,
  fallbackIndex: number,
): string {
  const zones = getCompetition(competitionId).zones;
  if (zones.length === 0) return '';
  if (clubZone && zones.includes(clubZone)) return clubZone;
  return zones[fallbackIndex % zones.length] as string;
}
