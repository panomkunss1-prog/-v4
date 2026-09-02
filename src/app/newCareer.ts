import type { ChairmanProfile } from '../core/chairman';
import type { Club } from '../core/club';
import type { ClubId } from '../core/ids';
import type { Manager } from '../core/manager';
import type { Player } from '../core/player';
import { createRng, seedFromString } from '../core/rng';
import { clubsForCompetition, getClub } from '../data/clubs.seed';
import { getRegulation } from '../data/regulations.data';
import { generateManager } from '../data/managers.seed';
import { generateSquad } from '../data/players.seed';
import { generateFixtures, totalMatchdays } from '../systems/league/fixtures';
import { initialBoardState, initialFanState } from '../systems/board/objectives';
import { totalWageBill } from '../systems/squad/squad';
import type { Squad } from '../systems/squad/squad';
import type { GameState } from './gameState';

export const STARTING_YEAR = 2026;

/**
 * Builds a complete, playable career. All randomness flows from one seeded
 * RNG so the same seed always produces the same career (duplicate risk D7).
 *
 * Slice 1 scope: the player's own competition is fully modelled. Other tiers
 * exist structurally in data but are not simulated until Slice 2.
 */
export function createCareer(
  chairman: ChairmanProfile,
  playerClubId: ClubId,
  seedText?: string,
): GameState {
  const playerClubDef = getClub(playerClubId);
  const competitionId = `T${playerClubDef.tier}`;
  const regulation = getRegulation(competitionId);
  const seed = seedFromString(seedText ?? `${chairman.name}:${playerClubId}`);
  const rng = createRng(seed);

  const competitionClubs = clubsForCompetition(competitionId);
  const clubs: Record<ClubId, Club> = {};
  const managers: Record<ClubId, Manager> = {};
  const squads: Record<ClubId, Squad> = {};
  const players: Player[] = [];

  for (const club of competitionClubs) {
    clubs[club.id] = { ...club };
    managers[club.id] = generateManager(club, rng);
    const squad = generateSquad(club, rng, regulation.foreignRegistrationMax.value);
    players.push(...squad);
    squads[club.id] = { clubId: club.id, playerIds: squad.map((p) => p.id) };
  }

  const seasonId = `${competitionId}-${STARTING_YEAR}`;
  const participantIds = competitionClubs.map((c) => c.id);
  const fixtures = generateFixtures(seasonId, participantIds, rng);

  const ownSquad = players.filter((p) => p.clubId === playerClubId);
  const weeklyWageBill = Math.round(totalWageBill(ownSquad) / 4);

  return {
    seed,
    year: STARTING_YEAR,
    chairman,
    playerClubId,
    clubs,
    managers,
    squads,
    players,
    season: {
      id: seasonId,
      competitionId,
      year: STARTING_YEAR,
      participantIds,
      zoneParticipants: {},
      totalMatchdays: totalMatchdays(participantIds.length),
      currentMatchday: 1,
      status: 'in_progress',
    },
    fixtures,
    results: [],
    finance: {
      balance: playerClubDef.startingBalance,
      transferBudget: Math.round(playerClubDef.startingBalance * 0.2),
      wageBudget: weeklyWageBill * 2,
      weeklyWageBill,
      ledger: [],
    },
    board: initialBoardState(playerClubDef, chairman.goal),
    fans: initialFanState(),
    decisions: [],
    lastMatchday: null,
  };
}
