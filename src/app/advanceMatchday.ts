import type { MatchResult } from '../core/match';
import { createRng } from '../core/rng';
import { getRegulation } from '../data/regulations.data';
import { simulateMatch, type MatchSide } from '../systems/match/simulateMatch';
import { applyMatchdayFinances } from '../systems/finance/ledger';
import { applyResultToBoard } from '../systems/board/objectives';
import { matchesForMatchday } from '../systems/league/fixtures';
import { err, ok, type Result } from '../core/result';
import type { GameState } from './gameState';
import { playersOfClub } from './gameState';

/**
 * Advances the season by exactly one matchday.
 *
 * Every fixture — the player's club and every other club — goes through the
 * single simulateMatch pipeline. Consequences are then applied by their
 * owning systems: finance by the finance system, confidence by the board
 * system. This function orchestrates; it does not contain business rules.
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

  const nextMatchday = matchday + 1;
  const seasonComplete = nextMatchday > state.season.totalMatchdays;

  return ok({
    ...state,
    fixtures: state.fixtures.map((f) =>
      f.matchday === matchday ? { ...f, status: 'played' as const } : f,
    ),
    results: [...state.results, ...newResults],
    finance,
    board,
    fans,
    lastMatchday: matchday,
    season: {
      ...state.season,
      currentMatchday: seasonComplete ? matchday : nextMatchday,
      status: seasonComplete ? ('complete' as const) : ('in_progress' as const),
    },
  });
}
