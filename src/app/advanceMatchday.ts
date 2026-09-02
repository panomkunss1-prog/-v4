import type { MatchResult } from '../core/match';
import { createRng } from '../core/rng';
import { getRegulation } from '../data/regulations.data';
import { simulateMatch, type MatchSide } from '../systems/match/simulateMatch';
import { applyMatchdayFinances, post } from '../systems/finance/ledger';
import { applyResultToBoard } from '../systems/board/objectives';
import { matchesForMatchday } from '../systems/league/fixtures';
import { applyTraining } from '../systems/facilities/training';
import { generateOffers, totalSponsorIncome } from '../systems/sponsorship/offers';
import { err, ok, type Result } from '../core/result';
import type { GameState } from './gameState';
import { playersOfClub } from './gameState';
import { performanceScore } from './performanceScore';

/**
 * Advances the season by exactly one matchday.
 *
 * Every fixture — the player's club and every other club — goes through the
 * single simulateMatch pipeline. Consequences are then applied by their
 * owning systems: finance by the finance system, confidence by the board
 * system, player growth by the facilities system, sponsor cash by the
 * sponsorship system. This function orchestrates; it does not contain
 * business rules of its own.
 */
export function advanceMatchday(state: GameState): Result<GameState> {
  if (state.season.status === 'complete') {
    return err('ฤดูกาลจบแล้ว — การเลื่อนชั้น/ตกชั้นอยู่นอกขอบเขต Slice 1');
  }

  const matchday = state.season.currentMatchday;
  const fixtures = matchesForMatchday(state.fixtures, matchday);
  if (fixtures.length === 0) return err(`ไม่มีโปรแกรมการแข่งขันในนัดที่ ${matchday}`);

  const regulation = getRegulation(state.season.competitionId);
  // Deriving the matchday RNG from the career seed keeps every run reproducible.
  const rng = createRng(state.seed + matchday * 7919);

  const sideFor = (clubId: string): MatchSide => {
    const club = state.clubs[clubId];
    const manager = state.managers[clubId];
    if (!club || !manager) throw new Error(`Missing club or manager: ${clubId}`);
    return { club, manager, squad: playersOfClub(state, clubId) };
  };

  const newResults: MatchResult[] = fixtures.map((fixture) =>
    simulateMatch(fixture, sideFor(fixture.homeClubId), sideFor(fixture.awayClubId), regulation, rng),
  );

  const ownResult = newResults.find(
    (r) => r.homeClubId === state.playerClubId || r.awayClubId === state.playerClubId,
  );

  let finance = state.finance;
  let board = state.board;
  let fans = state.fans;
  let players = state.players;

  if (ownResult) {
    const isHome = ownResult.homeClubId === state.playerClubId;
    const ownGoals = isHome ? ownResult.homeGoals : ownResult.awayGoals;
    const oppGoals = isHome ? ownResult.awayGoals : ownResult.homeGoals;
    const outcome = ownGoals > oppGoals ? 'win' : ownGoals === oppGoals ? 'draw' : 'loss';

    const club = state.clubs[state.playerClubId];
    if (club) finance = applyMatchdayFinances(finance, club, matchday, isHome, fans.mood);
    const moved = applyResultToBoard(board, fans, outcome);
    board = moved.board;
    fans = moved.fans;
  }

  // Sponsor income is paid every matchday regardless of fixture, like wages.
  const sponsorIncome = totalSponsorIncome(state.sponsors);
  if (sponsorIncome > 0) {
    finance = post(finance, matchday, 'sponsorship', sponsorIncome, 'รายได้จากสปอนเซอร์ที่เซ็นสัญญาไว้');
  }

  // Training only runs on the player's own squad — it is the club whose
  // training facility the chairman actually invests in and controls.
  const club = state.clubs[state.playerClubId];
  if (club) {
    const ownPlayers = playersOfClub(state, state.playerClubId);
    const trained = applyTraining(ownPlayers, club.trainingFacilityLevel, rng);
    const trainedIds = new Set(trained.map((p) => p.id));
    players = state.players.map((p) => (trainedIds.has(p.id) ? trained.find((t) => t.id === p.id)! : p));
  }

  const nextMatchday = matchday + 1;
  const seasonComplete = nextMatchday > state.season.totalMatchdays;

  const nextState: GameState = {
    ...state,
    fixtures: state.fixtures.map((f) =>
      f.matchday === matchday ? { ...f, status: 'played' as const } : f,
    ),
    results: [...state.results, ...newResults],
    finance,
    board,
    fans,
    players,
    lastMatchday: matchday,
    season: {
      ...state.season,
      currentMatchday: seasonComplete ? matchday : nextMatchday,
      status: seasonComplete ? ('complete' as const) : ('in_progress' as const),
    },
  };

  // Sponsor offers refresh each matchday against the club's latest form, so
  // a promotion push or a slump is reflected next time the chairman looks.
  const signedNames = new Set(state.sponsors.map((s) => s.name));
  const offers = generateOffers(performanceScore(nextState), matchday, rng, [...signedNames]);

  return ok({ ...nextState, sponsorOffers: offers });
}
