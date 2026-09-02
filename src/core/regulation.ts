import type { CompetitionId } from './ids';

/**
 * Brief §3 / §8: competition rules are CONFIGURATION, never hard-coded into
 * UI or match code. Anything not confirmed against the full published
 * regulation carries a verification flag and must not be presented as fact.
 */
export type VerificationStatus = 'VERIFIED' | 'NEEDS_VERIFICATION' | 'UNKNOWN';

export interface RegulationValue<T> {
  value: T;
  verification: VerificationStatus;
  /** Shown in the UI next to any non-verified rule. */
  note?: string;
}

export interface CompetitionRegulation {
  competitionId: CompetitionId;
  /** Max foreign players that may be registered in the squad. */
  foreignRegistrationMax: RegulationValue<number>;
  /**
   * Max foreign players in a matchday squad. `null` means the real rule is not
   * established; the check is skipped rather than a number being invented.
   */
  foreignMatchdayMax: RegulationValue<number | null>;
  promotionSlots: RegulationValue<number>;
  relegationSlots: RegulationValue<number>;
  pointsForWin: number;
  pointsForDraw: number;
}

export function isEnforceable<T>(rule: RegulationValue<T | null>): boolean {
  return rule.value !== null && rule.verification !== 'UNKNOWN';
}

export function needsVerification(regulation: CompetitionRegulation): boolean {
  return [
    regulation.foreignRegistrationMax,
    regulation.foreignMatchdayMax,
    regulation.promotionSlots,
    regulation.relegationSlots,
  ].some((rule) => rule.verification !== 'VERIFIED');
}
