import type { ClubId } from './ids';

/**
 * Derived state. Standings are NEVER persisted — they are recomputed from
 * match results so a save can never disagree with the table (duplicate risk D6).
 */
export interface StandingsRow {
  clubId: ClubId;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export type Standings = StandingsRow[];
