import type { Baht } from './money';

/**
 * SPONSOR SYSTEM types. Sponsor identities are fictional brand names (unlike
 * clubs/stadiums) — presenting a real company as a paid club sponsor would
 * imply an endorsement the prototype has no authority to make.
 */
export type SponsorTier = 'small' | 'medium' | 'large';

export const SPONSOR_CAP = 10;

export interface SponsorOffer {
  id: string;
  name: string;
  tier: SponsorTier;
  incomePerMatchday: Baht;
}

export interface Sponsor extends SponsorOffer {
  signedOnMatchday: number;
}

export const TIER_LABEL: Record<SponsorTier, string> = {
  small: 'สปอนเซอร์รายเล็ก',
  medium: 'สปอนเซอร์รายกลาง',
  large: 'สปอนเซอร์รายใหญ่',
};
