import { describe, expect, it } from 'vitest';
import {
  applyForeignMatchdayCap,
  checkMatchdaySquad,
  checkRegistration,
} from '../../src/systems/registration/eligibility';
import { getRegulation } from '../../src/data/regulations.data';
import type { CompetitionRegulation } from '../../src/core/regulation';
import type { Player } from '../../src/core/player';

let counter = 0;
const player = (isForeign: boolean, ability = 10): Player => ({
  id: `P${(counter += 1)}`,
  clubId: 'C',
  name: 'x',
  position: 'MF',
  ability,
  age: 25,
  isForeign,
  nationality: isForeign ? 'ต่างชาติ' : 'ไทย',
  nationalityCategory: isForeign ? 'other' : 'thai',
  verification: 'FICTIONAL',
  attributesSimulated: true,
  wage: 1000,
});

const squadWith = (foreign: number, domestic: number, ability = 10): Player[] => [
  ...Array.from({ length: foreign }, () => player(true, ability)),
  ...Array.from({ length: domestic }, () => player(false, ability)),
];

describe('registration eligibility', () => {
  it('accepts a T1 squad at the 10-foreign registration limit', () => {
    const report = checkRegistration(squadWith(10, 12), getRegulation('T1'));
    expect(report.compliant).toBe(true);
    expect(report.foreignCount).toBe(10);
    expect(report.foreignLimit).toBe(10);
  });

  it('rejects a T1 squad over the registration limit', () => {
    const report = checkRegistration(squadWith(11, 12), getRegulation('T1'));
    expect(report.compliant).toBe(false);
    expect(report.violations).toHaveLength(1);
  });

  it('enforces the T1 7-foreign matchday limit', () => {
    expect(checkMatchdaySquad(squadWith(7, 11), getRegulation('T1')).compliant).toBe(true);
    expect(checkMatchdaySquad(squadWith(8, 11), getRegulation('T1')).compliant).toBe(false);
  });

  it('applies the lower T2 and T3 registration limits from configuration', () => {
    expect(checkRegistration(squadWith(4, 18), getRegulation('T2')).compliant).toBe(true);
    expect(checkRegistration(squadWith(5, 18), getRegulation('T2')).compliant).toBe(false);
    expect(checkRegistration(squadWith(3, 19), getRegulation('T3')).compliant).toBe(true);
    expect(checkRegistration(squadWith(4, 19), getRegulation('T3')).compliant).toBe(false);
  });

  it('does NOT enforce the unknown T2/T3 matchday rule instead of inventing a number', () => {
    const t2 = checkMatchdaySquad(squadWith(9, 9), getRegulation('T2'));
    expect(t2.ruleEnforced).toBe(false);
    expect(t2.compliant).toBe(true);
    expect(t2.foreignLimit).toBeNull();
    expect(getRegulation('T2').foreignMatchdayMax.verification).toBe('UNKNOWN');
  });

  it('changing configuration changes behaviour with no code edit (brief §14)', () => {
    const custom: CompetitionRegulation = {
      ...getRegulation('T1'),
      foreignRegistrationMax: { value: 2, verification: 'VERIFIED' },
    };
    const squad = squadWith(3, 19);
    expect(checkRegistration(squad, getRegulation('T1')).compliant).toBe(true);
    expect(checkRegistration(squad, custom).compliant).toBe(false);
  });
});

describe('foreign matchday cap on selection', () => {
  const t1 = getRegulation('T1');

  it('swaps out the weakest foreign players until the cap is met', () => {
    const selection = [...squadWith(9, 2, 15)];
    const bench = squadWith(0, 6, 8);
    const capped = applyForeignMatchdayCap(selection, bench, t1);
    expect(capped.filter((p) => p.isForeign).length).toBe(7);
    expect(capped).toHaveLength(selection.length);
  });

  it('leaves a compliant selection untouched', () => {
    const selection = squadWith(5, 6);
    const capped = applyForeignMatchdayCap(selection, squadWith(0, 5), t1);
    expect(capped).toEqual(selection);
  });

  it('passes selection through unchanged when the rule is UNKNOWN', () => {
    const selection = squadWith(9, 2);
    const capped = applyForeignMatchdayCap(selection, squadWith(0, 6), getRegulation('T2'));
    expect(capped.filter((p) => p.isForeign).length).toBe(9);
  });

  it('does not fabricate players when no domestic replacements exist', () => {
    const selection = squadWith(11, 0);
    const capped = applyForeignMatchdayCap(selection, [], t1);
    expect(capped).toHaveLength(11);
  });
});

describe('category-aware registration status', () => {
  const t1 = getRegulation('T1');
  const categorised = (thai: number, asean: number, asian: number, other: number): Player[] => [
    ...Array.from({ length: thai }, () => ({ ...player(false), nationalityCategory: 'thai' as const })),
    ...Array.from({ length: asean }, () => ({ ...player(true), nationalityCategory: 'asean' as const })),
    ...Array.from({ length: asian }, () => ({ ...player(true), nationalityCategory: 'asian' as const })),
    ...Array.from({ length: other }, () => ({ ...player(true), nationalityCategory: 'other' as const })),
  ];

  it('reports COMPLIANT when within the flat limit', () => {
    expect(checkRegistration(categorised(14, 0, 0, 9), t1).status).toBe('COMPLIANT');
  });

  it('reports INDETERMINATE when the overflow is ASEAN/Asian and those quotas are unknown', () => {
    const report = checkRegistration(categorised(14, 3, 3, 10), t1);
    expect(report.status).toBe('INDETERMINATE');
    expect(report.violations).toHaveLength(0);
    expect(report.notes).toHaveLength(1);
  });

  it('still reports a real VIOLATION when the overflow is all general foreigners', () => {
    const report = checkRegistration(categorised(10, 0, 0, 12), t1);
    expect(report.status).toBe('VIOLATION');
    expect(report.violations).toHaveLength(1);
  });

  it('counts every nationality category', () => {
    const report = checkRegistration(categorised(14, 3, 3, 10), t1);
    expect(report.categoryCounts).toEqual({ thai: 14, asean: 3, asian: 3, other: 10, unknown: 0 });
  });

  it('leaves ASEAN and Asian quotas unenforced because they are UNKNOWN', () => {
    expect(t1.aseanRegistrationMax.verification).toBe('UNKNOWN');
    expect(t1.aseanRegistrationMax.value).toBeNull();
    expect(t1.asianRegistrationMax.verification).toBe('UNKNOWN');
    expect(t1.asianRegistrationMax.value).toBeNull();
  });
});
