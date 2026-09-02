import type { Sponsor, SponsorOffer, SponsorTier } from '../../core/sponsor';
import { SPONSOR_CAP } from '../../core/sponsor';
import type { Baht } from '../../core/money';
import type { Rng } from '../../core/rng';
import { SPONSOR_NAMES, TIER_INCOME_RANGE } from '../../data/sponsors.data';

/**
 * SPONSORSHIP SYSTEM. Offer tier is weighted by club performance: a strong
 * league position and confident board attract large-money sponsors; a poor
 * one only attracts small ones. `performanceScore` is 0..100, supplied by
 * the app layer (it decides how to blend position/form/confidence — this
 * system only turns a score into offers, it doesn't compute the score).
 */
const OFFERS_PER_ROUND = 3;

function tierWeights(performanceScore: number): Record<SponsorTier, number> {
  const p = Math.max(0, Math.min(100, performanceScore));
  return {
    small: Math.max(5, 100 - p),
    medium: 60 - Math.abs(p - 50) * 0.6,
    large: Math.max(2, p - 20),
  };
}

function weightedTier(weights: Record<SponsorTier, number>, rng: Rng): SponsorTier {
  const entries = Object.entries(weights) as [SponsorTier, number][];
  const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0);
  let roll = rng.float(0, total);
  for (const [tier, weight] of entries) {
    roll -= Math.max(0, weight);
    if (roll <= 0) return tier;
  }
  return entries[entries.length - 1]![0];
}

export function generateOffers(
  performanceScore: number,
  matchday: number,
  rng: Rng,
  excludeNames: readonly string[] = [],
): SponsorOffer[] {
  const weights = tierWeights(performanceScore);
  const used = new Set(excludeNames);
  const offers: SponsorOffer[] = [];

  for (let i = 0; i < OFFERS_PER_ROUND; i += 1) {
    const tier = weightedTier(weights, rng);
    const pool = SPONSOR_NAMES[tier].filter((n) => !used.has(n));
    const name = pool.length > 0 ? rng.pick(pool) : rng.pick(SPONSOR_NAMES[tier]);
    used.add(name);
    const [min, max] = TIER_INCOME_RANGE[tier];
    const incomePerMatchday: Baht = Math.round(rng.float(min, max) / 1000) * 1000;
    offers.push({ id: `SPO-${matchday}-${i}`, name, tier, incomePerMatchday });
  }
  return offers;
}

export function canSignMore(activeSponsors: readonly Sponsor[]): boolean {
  return activeSponsors.length < SPONSOR_CAP;
}

export function signSponsor(
  activeSponsors: readonly Sponsor[],
  offer: SponsorOffer,
  matchday: number,
): Sponsor[] {
  if (!canSignMore(activeSponsors)) return [...activeSponsors];
  return [...activeSponsors, { ...offer, signedOnMatchday: matchday }];
}

export function totalSponsorIncome(activeSponsors: readonly Sponsor[]): Baht {
  return activeSponsors.reduce((sum, s) => sum + s.incomePerMatchday, 0);
}
