import { describe, expect, it } from 'vitest';
import { canSignMore, generateOffers, signSponsor, totalSponsorIncome } from '../../src/systems/sponsorship/offers';
import { createRng } from '../../src/core/rng';
import type { Sponsor } from '../../src/core/sponsor';

describe('sponsor offer generation', () => {
  it('produces three offers each round', () => {
    expect(generateOffers(50, 1, createRng(1))).toHaveLength(3);
  });

  it('skews toward large sponsors for strong performance', () => {
    let large = 0;
    let total = 0;
    for (let seed = 0; seed < 200; seed += 1) {
      for (const offer of generateOffers(95, 1, createRng(seed))) {
        total += 1;
        if (offer.tier === 'large') large += 1;
      }
    }
    expect(large / total).toBeGreaterThan(0.3);
  });

  it('skews toward small sponsors for weak performance', () => {
    let small = 0;
    let total = 0;
    for (let seed = 0; seed < 200; seed += 1) {
      for (const offer of generateOffers(5, 1, createRng(seed))) {
        total += 1;
        if (offer.tier === 'small') small += 1;
      }
    }
    expect(small / total).toBeGreaterThan(0.5);
  });

  it('never offers a large sponsor to a club performing at rock bottom across a large sample', () => {
    // Not a hard guarantee (weights are probabilistic), but large should be
    // rare enough that none appear in a big enough sample at score 0.
    let large = 0;
    for (let seed = 0; seed < 500; seed += 1) {
      large += generateOffers(0, 1, createRng(seed)).filter((o) => o.tier === 'large').length;
    }
    expect(large / 1500).toBeLessThan(0.05);
  });

  it('is deterministic for the same seed', () => {
    expect(generateOffers(60, 3, createRng(77))).toEqual(generateOffers(60, 3, createRng(77)));
  });
});

describe('signing and the 10-sponsor cap', () => {
  const offer = { id: 'X', name: 'Test Co', tier: 'medium' as const, incomePerMatchday: 100000 };

  it('signs a sponsor and records the matchday', () => {
    const signed = signSponsor([], offer, 5);
    expect(signed).toHaveLength(1);
    expect(signed[0]).toMatchObject({ ...offer, signedOnMatchday: 5 });
  });

  it('refuses to sign an 11th sponsor', () => {
    const ten: Sponsor[] = Array.from({ length: 10 }, (_, i) => ({
      ...offer,
      id: `S${i}`,
      signedOnMatchday: 1,
    }));
    expect(canSignMore(ten)).toBe(false);
    expect(signSponsor(ten, offer, 2)).toHaveLength(10);
  });

  it('sums income across all active sponsors', () => {
    const sponsors: Sponsor[] = [
      { ...offer, id: 'A', incomePerMatchday: 50000, signedOnMatchday: 1 },
      { ...offer, id: 'B', incomePerMatchday: 75000, signedOnMatchday: 2 },
    ];
    expect(totalSponsorIncome(sponsors)).toBe(125000);
  });
});
