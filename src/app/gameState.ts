import type { ChairmanProfile } from '../core/chairman';
import type { Club } from '../core/club';
import type { CompetitionSeason } from '../core/competition';
import type { Manager } from '../core/manager';
import type { Match, MatchResult } from '../core/match';
import type { Player } from '../core/player';
import type { FinanceState } from '../core/finance';
import type { BoardState, FanState } from '../core/board';
import type { ExecutiveDecision } from '../core/decision';
import type { ClubId } from '../core/ids';
import type { Squad } from '../systems/squad/squad';

/**
 * APP owns application/session orchestration (brief DATA OWNERSHIP).
 * ONE GameState exists per career. The UI subscribes to it and never mutates
 * it directly (duplicate risk D8).
 *
 * NOTE: standings are NOT stored here. They are derived from `results` on
 * every read so the save can never disagree with the table (risk D6).
 */
export interface GameState {
  seed: number;
  year: number;
  chairman: ChairmanProfile;
  playerClubId: ClubId;
  /** Clubs are mutable at runtime (investment raises academy/facilities). */
  clubs: Record<ClubId, Club>;
  managers: Record<ClubId, Manager>;
  squads: Record<ClubId, Squad>;
  players: Player[];
  season: CompetitionSeason;
  fixtures: Match[];
  results: MatchResult[];
  finance: FinanceState;
  board: BoardState;
  fans: FanState;
  decisions: ExecutiveDecision[];
  /** Set by advanceMatchday so the result screen can show the last round. */
  lastMatchday: number | null;
}

export function playerClub(state: GameState): Club {
  const club = state.clubs[state.playerClubId];
  if (!club) throw new Error(`Player club missing from state: ${state.playerClubId}`);
  return club;
}

export function playerManager(state: GameState): Manager {
  const manager = state.managers[state.playerClubId];
  if (!manager) throw new Error(`Manager missing for club: ${state.playerClubId}`);
  return manager;
}

export function playersOfClub(state: GameState, clubId: ClubId): Player[] {
  return state.players.filter((p) => p.clubId === clubId);
}

export function resultsForMatchday(state: GameState, matchday: number): MatchResult[] {
  const ids = new Set(
    state.fixtures.filter((f) => f.matchday === matchday).map((f) => f.id),
  );
  return state.results.filter((r) => ids.has(r.matchId));
}
