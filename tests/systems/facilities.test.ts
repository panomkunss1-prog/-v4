import { describe, expect, it } from 'vitest';
import { capacityGainFor, upgradeStadium } from '../../src/systems/facilities/stadium';
import { applyTraining, upgradeTrainingFacility } from '../../src/systems/facilities/training';
import { createRng } from '../../src/core/rng';
import { T1_CLUBS } from '../../src/data/clubs.seed';
import type { Player } from '../../src/core/player';

const club = T1_CLUBS[0]!;

describe('stadium upgrades', () => {
  it('increases capacity proportional to investment', () => {
    const upgraded = upgradeStadium(club, 35_000_000);
    expect(upgraded.stadiumCapacity).toBeGreaterThan(club.stadiumCapacity);
  });

  it('does not mutate the input club', () => {
    upgradeStadium(club, 35_000_000);
    expect(club.stadiumCapacity).toBe(T1_CLUBS[0]!.stadiumCapacity);
  });

  it('never exceeds the prototype capacity ceiling', () => {
    const huge = upgradeStadium(club, 500_000_000);
    expect(huge.stadiumCapacity).toBeLessThanOrEqual(60000);
  });

  it('gives zero gain for zero investment', () => {
    expect(capacityGainFor(club, 0)).toBe(0);
  });

  it('preserves the real stadium name across an upgrade', () => {
    const upgraded = upgradeStadium(club, 10_000_000);
    expect(upgraded.stadiumName).toBe(club.stadiumName);
  });
});

describe('training facility upgrades', () => {
  it('raises the level with enough investment', () => {
    const upgraded = upgradeTrainingFacility({ ...club, trainingFacilityLevel: 1 }, 12_000_000);
    expect(upgraded.trainingFacilityLevel).toBe(2);
  });

  it('clamps at level 5', () => {
    const upgraded = upgradeTrainingFacility({ ...club, trainingFacilityLevel: 5 }, 50_000_000);
    expect(upgraded.trainingFacilityLevel).toBe(5);
  });

  it('does nothing below one level worth of investment', () => {
    const upgraded = upgradeTrainingFacility({ ...club, trainingFacilityLevel: 1 }, 1_000_000);
    expect(upgraded.trainingFacilityLevel).toBe(1);
  });
});

let counter = 0;
const player = (age: number, ability = 10): Player => ({
  id: `P${(counter += 1)}`,
  clubId: 'C',
  name: 'x',
  position: 'MF',
  ability,
  age,
  isForeign: false,
  nationality: 'ไทย',
  nationalityCategory: 'thai',
  verification: 'FICTIONAL',
  attributesSimulated: true,
  wage: 1000,
});

describe('training effect on players', () => {
  it('improves at least some young players over many matchdays at a high-level facility', () => {
    let players = Array.from({ length: 22 }, () => player(19, 10));
    const rng = createRng(1);
    for (let i = 0; i < 60; i += 1) {
      players = applyTraining(players, 5, rng);
    }
    expect(players.some((p) => p.ability > 10)).toBe(true);
  });

  it('never grows a player above the ability ceiling', () => {
    let players = [player(19, 20)];
    const rng = createRng(2);
    for (let i = 0; i < 100; i += 1) players = applyTraining(players, 5, rng);
    expect(players[0]!.ability).toBe(20);
  });

  it('is deterministic for the same seed', () => {
    const rng1 = createRng(9);
    const rng2 = createRng(9);
    let a = Array.from({ length: 10 }, (_, i) => ({ ...player(20, 8), id: `A${i}` }));
    let b = Array.from({ length: 10 }, (_, i) => ({ ...player(20, 8), id: `A${i}` }));
    for (let i = 0; i < 20; i += 1) {
      a = applyTraining(a, 4, rng1);
      b = applyTraining(b, 4, rng2);
    }
    expect(a.map((p) => p.ability)).toEqual(b.map((p) => p.ability));
  });

  it('gives senior players a lower improvement chance than youth at the same facility level', () => {
    const rng1 = createRng(3);
    const rng2 = createRng(3);
    let youth = Array.from({ length: 30 }, () => player(20, 10));
    let senior = Array.from({ length: 30 }, () => player(29, 10));
    for (let i = 0; i < 40; i += 1) {
      youth = applyTraining(youth, 5, rng1);
      senior = applyTraining(senior, 5, rng2);
    }
    const youthGrowth = youth.filter((p) => p.ability > 10).length;
    const seniorGrowth = senior.filter((p) => p.ability > 10).length;
    expect(youthGrowth).toBeGreaterThanOrEqual(seniorGrowth);
  });
});
