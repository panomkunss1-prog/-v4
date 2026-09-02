import { describe, expect, it } from 'vitest';
import {
  ATTRIBUTE_BASE,
  ATTRIBUTE_MAX,
  ATTRIBUTE_MIN,
  CHAIRMAN_ATTRIBUTE_KEYS,
  buildAttributes,
} from '../../src/core/chairman';
import { BACKGROUNDS, PERSONALITIES } from '../../src/data/chairmanOptions.data';

describe('chairman creation', () => {
  it('produces all eight attributes for every background/personality pair', () => {
    for (const background of BACKGROUNDS) {
      for (const personality of PERSONALITIES) {
        const attributes = buildAttributes(background, personality);
        expect(Object.keys(attributes).sort()).toEqual([...CHAIRMAN_ATTRIBUTE_KEYS].sort());
      }
    }
  });

  it('keeps every attribute inside the legal range', () => {
    for (const background of BACKGROUNDS) {
      for (const personality of PERSONALITIES) {
        for (const value of Object.values(buildAttributes(background, personality))) {
          expect(value).toBeGreaterThanOrEqual(ATTRIBUTE_MIN);
          expect(value).toBeLessThanOrEqual(ATTRIBUTE_MAX);
        }
      }
    }
  });

  it('applies the background bonus rather than leaving everything at base', () => {
    const footballer = buildAttributes('former_footballer', 'patient');
    const businessperson = buildAttributes('businessperson', 'patient');

    expect(footballer.footballKnowledge).toBeGreaterThan(ATTRIBUTE_BASE);
    expect(businessperson.business).toBeGreaterThan(ATTRIBUTE_BASE);
    // Backgrounds must be genuinely differentiated, not cosmetic.
    expect(footballer.footballKnowledge).toBeGreaterThan(businessperson.footballKnowledge);
    expect(businessperson.finance).toBeGreaterThan(footballer.finance);
  });

  it('stacks the personality bonus on top of the background bonus', () => {
    const conservative = buildAttributes('businessperson', 'financial_conservative');
    const risky = buildAttributes('businessperson', 'risk_taker');
    expect(conservative.finance).toBeGreaterThan(risky.finance);
    expect(risky.negotiation).toBeGreaterThan(conservative.negotiation);
  });
});
