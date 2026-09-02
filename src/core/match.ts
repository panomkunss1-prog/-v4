import type { ClubId, MatchId, PlayerId, SeasonId } from './ids';

export interface Match {
  id: MatchId;
  seasonId: SeasonId;
  matchday: number;
  homeClubId: ClubId;
  awayClubId: ClubId;
  status: 'scheduled' | 'played';
}

/**
 * Authoritative match outcome. Only the match system creates these; the UI
 * renders them and must never construct or recalculate one.
 */
export interface MatchResult {
  matchId: MatchId;
  homeClubId: ClubId;
  awayClubId: ClubId;
  homeGoals: number;
  awayGoals: number;
  scorerIds: PlayerId[];
  /**
   * High-level, read-only explanation of what each NPC manager did. Prose for
   * the chairman to read — never an editable control (brief PLAYER ROLE).
   * Both sides are carried so a chairman always reads their OWN manager.
   */
  homeManagerRationale: string;
  awayManagerRationale: string;
}

export type MatchOutcome = 'home_win' | 'away_win' | 'draw';

export function outcomeOf(result: MatchResult): MatchOutcome {
  if (result.homeGoals > result.awayGoals) return 'home_win';
  if (result.homeGoals < result.awayGoals) return 'away_win';
  return 'draw';
}
