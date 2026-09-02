import type { ClubId, Tier } from './ids';
import type { Baht } from './money';

/**
 * Static club definition. Fictional data only — brief §12 forbids importing
 * real player/club data into runtime without an approval pipeline.
 */
export interface Club {
  id: ClubId;
  name: string;
  shortName: string;
  city: string;
  tier: Tier;
  /** T3 only; undefined for T1/T2. */
  zone?: string;
  stadiumCapacity: number;
  /** 1..20 organisational ratings the chairman can invest in. */
  reputation: number;
  facilities: number;
  academy: number;
  startingBalance: Baht;
  /** Season ticket / regular attendance base, drives matchday revenue. */
  fanbase: number;
}
