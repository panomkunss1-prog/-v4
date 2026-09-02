import type { Club } from '../core/club';
import type { Player } from '../core/player';
import { checkRegistration, type RegistrationStatus } from '../systems/registration/eligibility';
import { averageAbility, foreignCount } from '../systems/squad/squad';
import { getRegulation } from '../data/regulations.data';
import { currentStandings } from './standingsQuery';
import { positionOf } from '../systems/league/standings';
import type { GameState } from './gameState';
import { playerClub, playersOfClub } from './gameState';

/**
 * Read-model for the UI. The UI is forbidden from importing the systems layer
 * (enforced in tests/architecture/dependencies.test.ts), so every derived
 * value it needs is assembled here and handed over as plain data.
 */
export interface ClubOverview {
  club: Club;
  squadSize: number;
  averageAbility: number;
  foreignPlayers: number;
  foreignRegistrationLimit: number | null;
  registrationStatus: RegistrationStatus;
  registrationCompliant: boolean;
  registrationViolations: string[];
  /** Explanations for an INDETERMINATE result (unknown category quotas). */
  registrationNotes: string[];
  categoryCounts: { thai: number; asean: number; asian: number; other: number; unknown: number };
  /** How many squad members came from an approved research document. */
  researchedPlayers: number;
  /** True when a rule is applied from an unverified source (brief §3). */
  regulationNeedsVerification: boolean;
  regulationNote: string | null;
  leaguePosition: number;
  squad: Player[];
}

export function clubOverview(state: GameState): ClubOverview {
  const club = playerClub(state);
  const squad = playersOfClub(state, club.id);
  const regulation = getRegulation(state.season.competitionId);
  const registration = checkRegistration(squad, regulation);

  return {
    club,
    squadSize: squad.length,
    averageAbility: Math.round(averageAbility(squad) * 10) / 10,
    foreignPlayers: foreignCount(squad),
    foreignRegistrationLimit: registration.foreignLimit,
    registrationStatus: registration.status,
    registrationCompliant: registration.compliant,
    registrationViolations: registration.violations,
    registrationNotes: registration.notes,
    categoryCounts: registration.categoryCounts,
    researchedPlayers: squad.filter((p) => p.verification !== 'FICTIONAL').length,
    regulationNeedsVerification:
      regulation.foreignRegistrationMax.verification !== 'VERIFIED',
    regulationNote: regulation.foreignRegistrationMax.note ?? null,
    // Before any match is played every club is level, so the sort order is
    // arbitrary — report "no position yet" rather than a meaningless #1.
    leaguePosition: state.results.length === 0 ? 0 : positionOf(currentStandings(state), club.id),
    squad,
  };
}
