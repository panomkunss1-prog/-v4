import type { ClubId, CompetitionId, SeasonId, Tier } from './ids';

export interface Competition {
  id: CompetitionId;
  name: string;
  shortName: string;
  tier: Tier;
  /** T3 runs 6 regional zones; T1/T2 are single tables. */
  zones: string[];
  expectedClubCount: number;
}

export interface CompetitionSeason {
  id: SeasonId;
  competitionId: CompetitionId;
  year: number;
  /**
   * The clubs whose matches the player actually plays through. For a zoned
   * competition (T3) that is the player's own zone, not all 69 clubs — the
   * real format is regional groups, and one 69-club table would also mean a
   * 138-matchday season.
   */
  participantIds: ClubId[];
  /** Zone name -> club ids, empty for single-table competitions. */
  zoneParticipants: Record<string, ClubId[]>;
  /** Which zone `participantIds` represents, for zoned competitions. */
  zone?: string;
  totalMatchdays: number;
  currentMatchday: number;
  status: 'in_progress' | 'complete';
}
