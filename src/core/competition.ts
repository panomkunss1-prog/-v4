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
  participantIds: ClubId[];
  /** Zone name -> club ids, empty for single-table competitions. */
  zoneParticipants: Record<string, ClubId[]>;
  totalMatchdays: number;
  currentMatchday: number;
  status: 'in_progress' | 'complete';
}
