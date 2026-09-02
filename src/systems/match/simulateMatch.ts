import type { Club } from '../../core/club';
import type { Manager } from '../../core/manager';
import type { Match, MatchResult } from '../../core/match';
import type { Player } from '../../core/player';
import type { CompetitionRegulation } from '../../core/regulation';
import type { Rng } from '../../core/rng';
import { selectTeam } from './teamSelection';

/**
 * ============================================================================
 * THE SINGLE AUTHORITATIVE MATCH PIPELINE (duplicate risk D2).
 * ============================================================================
 * Every match in the prototype — the player's club and every other club —
 * runs through this one function. There is no "quick sim" alternative path;
 * detail level is an output concern, never a second code path.
 *
 * Only this module constructs a MatchResult. The UI renders results and must
 * never create or recalculate one (brief ARCHITECTURE).
 */
export interface MatchSide {
  club: Club;
  manager: Manager;
  squad: Player[];
}

const HOME_ADVANTAGE = 0.35;

/** Expected goals from a strength differential, kept in a sane football range. */
function expectedGoals(own: number, opponent: number, facilities: number): number {
  const diff = own - opponent;
  const base = 1.25 + diff * 0.28 + facilities * 0.01;
  return Math.max(0.15, Math.min(4.2, base));
}

/** Knuth's Poisson sampler, driven by the injected seeded RNG. */
function poisson(lambda: number, rng: Rng): number {
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rng.next();
  } while (p > limit && k < 15);
  return k - 1;
}

export function simulateMatch(
  match: Match,
  home: MatchSide,
  away: MatchSide,
  regulation: CompetitionRegulation,
  rng: Rng,
): MatchResult {
  const homeTeam = selectTeam(home.squad, home.manager, regulation);
  const awayTeam = selectTeam(away.squad, away.manager, regulation);

  const homeStrength = homeTeam.strength + HOME_ADVANTAGE + home.club.facilities * 0.02;
  const awayStrength = awayTeam.strength;

  const homeGoals = poisson(expectedGoals(homeStrength, awayStrength, home.club.facilities), rng);
  const awayGoals = poisson(expectedGoals(awayStrength, homeStrength, away.club.facilities), rng);

  const scorerIds = [
    ...pickScorers(homeTeam.starters, homeGoals, rng),
    ...pickScorers(awayTeam.starters, awayGoals, rng),
  ];

  return {
    matchId: match.id,
    homeClubId: match.homeClubId,
    awayClubId: match.awayClubId,
    homeGoals,
    awayGoals,
    scorerIds,
    homeManagerRationale: homeTeam.rationale,
    awayManagerRationale: awayTeam.rationale,
  };
}

/** Attacking players are likelier to score; weighting is ability-based. */
function pickScorers(starters: readonly Player[], goals: number, rng: Rng): string[] {
  if (goals === 0 || starters.length === 0) return [];
  const weighted: Player[] = [];
  for (const player of starters) {
    const weight =
      player.position === 'FW' ? 5 : player.position === 'MF' ? 3 : player.position === 'DF' ? 1 : 0;
    for (let i = 0; i < weight; i += 1) weighted.push(player);
  }
  if (weighted.length === 0) return [];
  return Array.from({ length: goals }, () => rng.pick(weighted).id);
}

