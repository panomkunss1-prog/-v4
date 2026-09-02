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
