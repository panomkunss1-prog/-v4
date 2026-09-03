import type { ClubId } from '../core/ids';
import type { Club } from '../core/club';
import type { Manager } from '../core/manager';
import type { Player } from '../core/player';
import type { Standings } from '../core/standings';
import { createRng } from '../core/rng';
import { err, ok, type Result } from '../core/result';
import { getClub } from '../data/clubs.seed';
import { getRegulation } from '../data/regulations.data';
import { isZonedCompetition, zoneForClub } from '../data/competitions.data';
import { generateManager } from '../data/managers.seed';
import { generateSquad } from '../data/players.seed';
import { generateFixtures, totalMatchdays } from '../systems/league/fixtures';
import { positionOf } from '../systems/league/standings';
import { resolvePyramid, type PyramidMovement } from '../systems/league/promotionRelegation';
import { initialBoardState, judgeSeason, type SeasonVerdict } from '../systems/board/objectives';
import { totalWageBill } from '../systems/squad/squad';
import { generateOffers } from '../systems/sponsorship/offers';
import { preseasonDate } from '../systems/calendar/seasonCalendar';
import type { Squad } from '../systems/squad/squad';
import type { GameState, SeasonRecord } from './gameState';
import { playerClub, playersOfClub } from './gameState';
import { currentStandings } from './standingsQuery';
import { performanceScore } from './performanceScore';
import { resolveCompetition } from './resolveOtherTiers';
import { COMPETITION_ORDER } from './newCareer';

/**
 * Everything the Season End screen needs. Produced once when the season
 * completes, and consumed by `startNextSeason` to roll the career forward.
 */
export interface SeasonOutcome {
  year: number;
  competitionId: string;
  zone?: string;
  finalStandings: Standings;
  finalPosition: number;
  verdict: SeasonVerdict;
  movement: PyramidMovement;
  /** Where the player's club will play next season. */
  nextCompetitionId: string;
  outcome: 'promoted' | 'relegated' | 'stayed';
  promotedClubs: ClubId[];
  relegatedClubs: ClubId[];
}

/**
 * Judges the completed season and works out how the pyramid moves.
 *
 * The player's own table comes from the matches they actually played. Every
 * other competition is resolved here through the same match pipeline, so
 * promotion and relegation are decided by real results rather than a
 * shortcut ranking.
 */
export function endSeason(state: GameState): Result<SeasonOutcome> {
  if (state.season.status !== 'complete') {
    return err('ฤดูกาลยังไม่จบ — ต้องแข่งให้ครบทุกนัดก่อน');
  }

  const ownStandings = currentStandings(state);
  const finalPosition = positionOf(ownStandings, state.playerClubId);
  const club = playerClub(state);

  const verdict = judgeSeason({
    board: state.board,
    finalPosition,
    clubCount: ownStandings.length,
    closingBalance: state.finance.balance,
    academy: club.academy,
  });

  // The player's own competition uses the table they played. For a zoned
  // competition that is one zone, so the tier still has to be resolved in
  // full to know who reaches the champions stage.
  const standingsOf: Record<string, Standings> = {};
  const zoneStandingsOf: Record<string, Record<string, Standings>> = {};

  for (const competitionId of COMPETITION_ORDER) {
    const members = state.leagueMembership[competitionId] ?? [];
    if (members.length === 0) continue;

    const isPlayerCompetition = competitionId === state.season.competitionId;
    const isZoned = isZonedCompetition(competitionId);

    if (isPlayerCompetition && !isZoned) {
      standingsOf[competitionId] = ownStandings;
      continue;
    }

    const resolved = resolveCompetition(competitionId, members, state.seed, state.year);
    standingsOf[competitionId] = resolved.standings;
    zoneStandingsOf[competitionId] = resolved.zoneStandings;

    // In a zoned competition the player's own zone is the one they played,
    // so their real table replaces the simulated stand-in for that zone.
    if (isPlayerCompetition && state.season.zone) {
      zoneStandingsOf[competitionId] = {
        ...resolved.zoneStandings,
        [state.season.zone]: ownStandings,
      };
    }
  }

  const regulationOf = Object.fromEntries(
    COMPETITION_ORDER.map((id) => [id, getRegulation(id)]),
  );

  const movement = resolvePyramid({
    competitionIds: COMPETITION_ORDER,
    standingsOf,
    regulationOf,
  });

  const nextCompetitionId =
    movement.nextCompetitionOf[state.playerClubId] ?? state.season.competitionId;
  const currentTier = COMPETITION_ORDER.indexOf(state.season.competitionId as 'T1');
  const nextTier = COMPETITION_ORDER.indexOf(nextCompetitionId as 'T1');
  const outcome: SeasonOutcome['outcome'] =
    nextTier < currentTier ? 'promoted' : nextTier > currentTier ? 'relegated' : 'stayed';

  return ok({
    year: state.year,
    competitionId: state.season.competitionId,
    ...(state.season.zone ? { zone: state.season.zone } : {}),
    finalStandings: ownStandings,
    finalPosition,
    verdict,
    movement,
    nextCompetitionId,
    outcome,
    promotedClubs: movement.movements.flatMap((m) => m.promoted),
    relegatedClubs: movement.movements.flatMap((m) => m.relegated),
  });
}

/**
 * Rolls the career into the next season: applies the pyramid movement, moves
 * the player's club if it went up or down, rebuilds the competition around
 * them, ages the squad and starts a fresh table.
 *
 * Money, board, sponsors, stadium and training-ground upgrades all carry
 * over — those are the chairman's accumulated work.
 */
export function startNextSeason(state: GameState, outcome: SeasonOutcome): Result<GameState> {
  const year = state.year + 1;
  const competitionId = outcome.nextCompetitionId;
  const regulation = getRegulation(competitionId);
  const rng = createRng(state.seed + year * 31337);

  // Apply every movement to the persisted membership.
  const leagueMembership: Record<string, ClubId[]> = {};
  for (const id of COMPETITION_ORDER) {
    leagueMembership[id] = (state.leagueMembership[id] ?? []).filter(
      (clubId) => (outcome.movement.nextCompetitionOf[clubId] ?? id) === id,
    );
  }
  for (const [clubId, destination] of Object.entries(outcome.movement.nextCompetitionOf)) {
    const list = leagueMembership[destination];
    if (list && !list.includes(clubId)) list.push(clubId);
  }

  const members = leagueMembership[competitionId] ?? [];
  const playerClubDef = getClub(state.playerClubId);
  const zoned = isZonedCompetition(competitionId);

  // A promoted or relegated club needs a zone for its new tier; keep its own
  // where it has one, otherwise fall back to the first zone available.
  let zone: string | undefined;
  let participantIds: ClubId[];
  if (zoned) {
    const playerIndex = Math.max(0, members.indexOf(state.playerClubId));
    zone = zoneForClub(competitionId, playerClubDef.zone, playerIndex);
    participantIds = members.filter(
      (id, index) => zoneForClub(competitionId, getClub(id).zone, index) === zone,
    );
    if (!participantIds.includes(state.playerClubId)) participantIds.push(state.playerClubId);
  } else {
    participantIds = [...members];
    if (!participantIds.includes(state.playerClubId)) participantIds.push(state.playerClubId);
  }

  // Rebuild the clubs the player will actually face. Their own club keeps the
  // upgrades it has earned rather than reverting to seed values.
  const clubs: Record<ClubId, Club> = {};
  const managers: Record<ClubId, Manager> = {};
  const squads: Record<ClubId, Squad> = {};
  const players: Player[] = [];

  const ownPlayers = playersOfClub(state, state.playerClubId).map((p) => ({
    ...p,
    age: p.age + 1,
  }));

  for (const clubId of participantIds) {
    const base = getClub(clubId);
    if (clubId === state.playerClubId) {
      const carried = state.clubs[clubId] ?? base;
      clubs[clubId] = carried;
      managers[clubId] = state.managers[clubId] ?? generateManager(carried, rng);
      players.push(...ownPlayers);
      squads[clubId] = { clubId, playerIds: ownPlayers.map((p) => p.id) };
      continue;
    }
    clubs[clubId] = { ...base };
    managers[clubId] = generateManager(base, rng);
    const squad = generateSquad(base, rng, regulation.foreignRegistrationMax.value);
    players.push(...squad);
    squads[clubId] = { clubId, playerIds: squad.map((p) => p.id) };
  }

  const seasonId = `${competitionId}-${year}${zone ? `-${zone}` : ''}`;
  const fixtures = generateFixtures(seasonId, participantIds, rng);
  const weeklyWageBill = Math.round(totalWageBill(ownPlayers) / 4);

  const ownRow = outcome.finalStandings.find((r) => r.clubId === state.playerClubId);
  const record: SeasonRecord = {
    year: state.year,
    competitionId: outcome.competitionId,
    ...(outcome.zone ? { zone: outcome.zone } : {}),
    finalPosition: outcome.finalPosition,
    played: ownRow?.played ?? 0,
    won: ownRow?.won ?? 0,
    drawn: ownRow?.drawn ?? 0,
    lost: ownRow?.lost ?? 0,
    points: ownRow?.points ?? 0,
    objectivesMet: outcome.verdict.allMet,
    outcome: outcome.outcome,
    closingBalance: state.finance.balance,
  };

  const board = {
    ...initialBoardState(clubs[state.playerClubId] as Club, state.chairman.goal),
    confidence: outcome.verdict.confidence,
  };

  const next: GameState = {
    ...state,
    year,
    clubs,
    managers,
    squads,
    players,
    season: {
      id: seasonId,
      competitionId,
      year,
      participantIds,
      zoneParticipants: zone ? { [zone]: participantIds } : {},
      ...(zone ? { zone } : {}),
      totalMatchdays: totalMatchdays(participantIds.length),
      currentMatchday: 1,
      status: 'in_progress',
    },
    fixtures,
    results: [],
    finance: { ...state.finance, weeklyWageBill },
    board,
    leagueMembership,
    history: [...state.history, record],
    lastMatchday: null,
    currentDate: preseasonDate(year),
    // A fresh season's inbox starts clean; last season's news is still
    // available via history for the record.
    inbox: [],
  };

  return ok({ ...next, sponsorOffers: generateOffers(performanceScore(next), 0, rng) });
}
