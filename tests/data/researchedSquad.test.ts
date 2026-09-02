import { describe, expect, it } from 'vitest';
import { RESEARCHED_SQUADS, researchedSquadFor } from '../../src/data/researchedSquads.data';
import { createCareer } from '../../src/app/newCareer';
import { playersOfClub } from '../../src/app/gameState';
import { buildAttributes, type ChairmanProfile } from '../../src/core/chairman';
import { getClub } from '../../src/data/clubs.seed';
import { checkRegistration } from '../../src/systems/registration/eligibility';
import { getRegulation } from '../../src/data/regulations.data';

const chairman: ChairmanProfile = {
  name: 'ทดสอบ ข้อมูลจริง',
  background: 'businessperson',
  personality: 'ambitious',
  goal: 'win_title',
  attributes: buildAttributes('businessperson', 'ambitious'),
};

describe('Buriram United researched squad data', () => {
  const squad = researchedSquadFor('T1-01');

  it('is attached to the club the source document names', () => {
    expect(squad).not.toBeNull();
    expect(squad!.expectedClubName).toBe('บุรีรัมย์ ยูไนเต็ด');
    expect(getClub('T1-01').name).toBe(squad!.expectedClubName);
  });

  it('holds all 30 players from the source document', () => {
    expect(squad!.players).toHaveLength(30);
  });

  it('matches the source document position breakdown', () => {
    const byPosition = squad!.players.reduce<Record<string, number>>((acc, p) => {
      const key = p.position ?? 'UNKNOWN';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    expect(byPosition).toEqual({ GK: 3, DF: 10, MF: 11, FW: 6 });
  });

  it('matches the source document nationality breakdown', () => {
    const byCategory = squad!.players.reduce<Record<string, number>>((acc, p) => {
      acc[p.nationalityCategory] = (acc[p.nationalityCategory] ?? 0) + 1;
      return acc;
    }, {});
    expect(byCategory).toEqual({ thai: 14, asean: 3, asian: 3, other: 10 });
  });

  it('gives every player a unique shirt number', () => {
    const numbers = squad!.players.map((p) => p.squadNumber);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('carries the source and preserves the CONFLICTED flag the document raised', () => {
    expect(squad!.source).toContain('Buriram United');
    const fandi = squad!.players.find((p) => p.name === 'Ilhan Fandi');
    expect(fandi?.verification).toBe('CONFLICTED');
    expect(fandi?.note).toBeTruthy();
  });

  it('keeps the document excluded names OUT of the importable squad', () => {
    expect(squad!.notImported).toHaveLength(9);
    const importedNames = new Set(squad!.players.map((p) => p.name));
    for (const excluded of squad!.notImported) {
      expect(importedNames.has(excluded)).toBe(false);
    }
  });

  it('invents no DOB, preferred foot or contract field', () => {
    for (const player of squad!.players) {
      expect(player).not.toHaveProperty('dateOfBirth');
      expect(player).not.toHaveProperty('preferredFoot');
      expect(player).not.toHaveProperty('contractUntil');
    }
  });

  it('only registers researched squads for clubs that exist', () => {
    for (const clubId of Object.keys(RESEARCHED_SQUADS)) {
      expect(() => getClub(clubId)).not.toThrow();
    }
  });
});

describe('researched squad in a live career', () => {
  const state = createCareer(chairman, 'T1-01', 'researched-seed');
  const squad = playersOfClub(state, 'T1-01');

  it('imports the real names into runtime', () => {
    expect(squad).toHaveLength(30);
    const names = squad.map((p) => p.name);
    expect(names).toContain('Neil Etheridge');
    expect(names).toContain('ศุภณัฏฐ์ เหมือนตา');
    expect(names).toContain('Guilherme Bissoli');
  });

  it('marks every researched player attribute as SIMULATED, never a fact', () => {
    for (const player of squad) {
      expect(player.attributesSimulated).toBe(true);
      expect(player.verification).not.toBe('FICTIONAL');
      expect(player.source).toBeTruthy();
    }
  });

  it('preserves shirt numbers and nationalities verbatim', () => {
    const etheridge = squad.find((p) => p.name === 'Neil Etheridge');
    expect(etheridge?.squadNumber).toBe(13);
    expect(etheridge?.nationality).toBe('ฟิลิปปินส์/อังกฤษ');
    expect(etheridge?.nationalityCategory).toBe('asean');
  });

  it('still produces playable simulated attributes', () => {
    for (const player of squad) {
      expect(player.ability).toBeGreaterThanOrEqual(1);
      expect(player.ability).toBeLessThanOrEqual(20);
      expect(player.age).toBeGreaterThanOrEqual(18);
      expect(player.wage).toBeGreaterThan(0);
    }
  });

  it('reports INDETERMINATE registration, not a false violation', () => {
    const report = checkRegistration(squad, getRegulation('T1'));
    expect(report.status).toBe('INDETERMINATE');
    expect(report.violations).toHaveLength(0);
    expect(report.notes[0]).toContain('อาเซียน');
    expect(report.foreignCount).toBe(16);
    expect(report.categoryCounts).toEqual({ thai: 14, asean: 3, asian: 3, other: 10, unknown: 0 });
  });

  it('is reproducible: the same seed yields the same simulated attributes', () => {
    const again = playersOfClub(createCareer(chairman, 'T1-01', 'researched-seed'), 'T1-01');
    expect(again.map((p) => p.ability)).toEqual(squad.map((p) => p.ability));
  });
});
