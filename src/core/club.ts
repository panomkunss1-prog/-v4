import type { ClubId, Tier } from './ids';
import type { Baht } from './money';

/**
 * Static club definition. Club/stadium identities are real (per project
 * owner direction, overriding the brief §12 fictional-only default for this
 * category only); player, manager and sponsor data stay fictional — see
 * data/clubs.seed.ts for provenance notes per tier.
 */
export interface Club {
  id: ClubId;
  name: string;
  shortName: string;
  city: string;
  tier: Tier;
  /** T3 only; undefined for T1/T2. */
  zone?: string;
  stadiumName: string;
  stadiumCapacity: number;
  /** 1..20 organisational ratings the chairman can invest in. */
  reputation: number;
  /** General club amenities/matchday facilities rating. */
  facilities: number;
  academy: number;
  /**
   * First-team training ground quality, 1..5. Distinct from `facilities`:
   * this specifically drives player ability development (brief request #3).
   */
  trainingFacilityLevel: number;
  startingBalance: Baht;
  /** Season ticket / regular attendance base, drives matchday revenue. */
  fanbase: number;
}

export const TRAINING_FACILITY_MIN = 1;
export const TRAINING_FACILITY_MAX = 5;
