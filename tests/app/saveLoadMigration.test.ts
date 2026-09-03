import { describe, expect, it } from 'vitest';
import { migrateSave } from '../../src/app/saveLoad';
import { createCareer } from '../../src/app/newCareer';
import { buildAttributes, type ChairmanProfile } from '../../src/core/chairman';
import type { GameState } from '../../src/app/gameState';

const chairman: ChairmanProfile = {
  name: 'ทดสอบ ย้ายเซฟ',
  background: 'businessperson',
  personality: 'ambitious',
  goal: 'promotion',
  attributes: buildAttributes('businessperson', 'ambitious'),
};

/** Simulates a save written before the game clock existed. */
function oldSaveShape(state: GameState): GameState {
  const { currentDate, inbox, ...rest } = state;
  void currentDate;
  void inbox;
  return rest as GameState;
}

describe('save migration', () => {
  it('backfills currentDate and inbox on a pre-clock save at matchday 1', () => {
    const fresh = createCareer(chairman, 'T1-01', 'migrate-seed');
    const old = oldSaveShape(fresh);
    expect(old).not.toHaveProperty('currentDate');

    const migrated = migrateSave(old);
    expect(migrated.currentDate).toBeDefined();
    expect(Array.isArray(migrated.inbox)).toBe(true);
    expect(migrated.inbox).toHaveLength(0);
  });

  it('loses no existing data during migration', () => {
    const fresh = createCareer(chairman, 'T1-01', 'migrate-seed-2');
    const old = oldSaveShape(fresh);
    const migrated = migrateSave(old);

    const { currentDate: _d, inbox: _i, ...migratedRest } = migrated;
    const { currentDate: _d2, inbox: _i2, ...freshRest } = fresh;
    expect(migratedRest).toEqual(freshRest);
  });

  it('reconstructs a plausible date for a save mid-season', () => {
    const fresh = createCareer(chairman, 'T1-01', 'migrate-seed-3');
    const midSeason: GameState = oldSaveShape({
      ...fresh,
      season: { ...fresh.season, currentMatchday: 10 },
    });
    const migrated = migrateSave(midSeason);
    // Should reconstruct from matchday 9 (the last one actually played).
    expect(migrated.currentDate.year).toBe(fresh.year);
  });

  it('is idempotent: migrating an already-migrated save changes nothing', () => {
    const fresh = createCareer(chairman, 'T1-01', 'migrate-seed-4');
    const once = migrateSave(fresh);
    const twice = migrateSave(once);
    expect(twice).toEqual(once);
  });

  it('never throws on a save missing both fields entirely', () => {
    const fresh = createCareer(chairman, 'T1-01', 'migrate-seed-5');
    const old = oldSaveShape(fresh);
    expect(() => migrateSave(old)).not.toThrow();
  });
});
