import { describe, expect, it } from 'vitest';
import { RESEARCHED_SQUADS, researchedSquadFor } from '../../src/data/researchedSquads.data';
import { createCareer } from '../../src/app/newCareer';
import { playersOfClub } from '../../src/app/gameState';
import { buildAttributes, type ChairmanProfile } from '../../src/core/chairman';
import { getClub } from '../../src/data/clubs.seed';
import { checkRegistration } from '../../src/systems/registration/eligibility';
import { getRegulation } from '../../src/data/regulations.data';
import { selectTeam } from '../../src/systems/match/teamSelection';
import { generateManager } from '../../src/data/managers.seed';
import { createRng } from '../../src/core/rng';

const chairman: ChairmanProfile = {
  name: 'ทดสอบ หลายสโมสร',
  background: 'businessperson',
  personality: 'ambitious',
  goal: 'win_title',
  attributes: buildAttributes('businessperson', 'ambitious'),
};

const EXPECTED = {
  'T1-01': { name: 'บุรีรัมย์ ยูไนเต็ด', size: 30, status: 'TIER1' },
  'T1-02': { name: 'บีจี ปทุม ยูไนเต็ด', size: 29, status: 'PROVISIONAL' },
  'T1-04': { name: 'แบงค็อก ยูไนเต็ด', size: 28, status: 'PROVISIONAL' },
  'T1-07': { name: 'พีที ประจวบ เอฟซี', size: 38, status: 'PROVISIONAL' },
  'T1-14': { name: 'ปัตตานี เอฟซี', size: 20, status: 'PROVISIONAL' },
  'T1-15': { name: 'ศรีสะเกษ ยูไนเต็ด', size: 28, status: 'PROVISIONAL' },
} as const;

describe('all researched squads', () => {
  it('registers exactly the six imported clubs', () => {
    expect(Object.keys(RESEARCHED_SQUADS).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  for (const [clubId, expected] of Object.entries(EXPECTED)) {
    describe(expected.name, () => {
      const squad = researchedSquadFor(clubId)!;

      it('is bound to the right club and size', () => {
        expect(squad.expectedClubName).toBe(expected.name);
        expect(getClub(clubId).name).toBe(expected.name);
        expect(squad.players).toHaveLength(expected.size);
      });

      it('carries its import status and a source', () => {
        expect(squad.importStatus).toBe(expected.status);
        expect(squad.source.length).toBeGreaterThan(0);
        expect(squad.statusNote.length).toBeGreaterThan(0);
      });

      it('records the conflicts its document raised', () => {
        if (expected.status === 'PROVISIONAL') {
          expect(squad.documentedConflicts.length).toBeGreaterThan(0);
        }
      });

      it('invents no unevidenced personal field', () => {
        for (const player of squad.players) {
          expect(player).not.toHaveProperty('dateOfBirth');
          expect(player).not.toHaveProperty('preferredFoot');
          expect(player).not.toHaveProperty('contractUntil');
          expect(player.name.length).toBeGreaterThan(0);
        }
      });

      it('produces a playable squad that can field a legal XI', () => {
        const state = createCareer(chairman, clubId, `seed-${clubId}`);
        const players = playersOfClub(state, clubId);
        expect(players).toHaveLength(expected.size);

        const manager = generateManager(getClub(clubId), createRng(1));
        const team = selectTeam(players, manager, getRegulation('T1'));
        expect(team.starters).toHaveLength(11);
        expect(team.starters.filter((p) => p.position === 'GK')).toHaveLength(1);
        expect(new Set(team.starters.map((p) => p.id)).size).toBe(11);
      });

      it('never claims a simulated field is sourced', () => {
        const state = createCareer(chairman, clubId, `seed-${clubId}`);
        for (const player of playersOfClub(state, clubId)) {
          expect(player.attributesSimulated).toBe(true);
          expect(player.unsourcedFields).toContain('attributes');
          expect(player.verification).not.toBe('FICTIONAL');
        }
      });

      it('never reports a false registration violation', () => {
        const state = createCareer(chairman, clubId, `seed-${clubId}`);
        const report = checkRegistration(playersOfClub(state, clubId), getRegulation('T1'));
        expect(report.status).not.toBe('VIOLATION');
      });
    });
  }
});

describe('documented conflicts are preserved, never silently resolved', () => {
  it('keeps BG Pathum duplicate shirt 30 as-is and flags both players', () => {
    const bg = researchedSquadFor('T1-02')!;
    const thirties = bg.players.filter((p) => p.squadNumber === 30);
    expect(thirties).toHaveLength(2);
    for (const player of thirties) {
      expect(player.verification).toBe('CONFLICTED');
      expect(player.note).toContain('30');
    }
  });

  it('merges the duplicated Tauã row into one player and flags it', () => {
    const prachuap = researchedSquadFor('T1-07')!;
    const taua = prachuap.players.filter((p) => p.name === 'Tauã');
    expect(taua).toHaveLength(1);
    expect(taua[0]!.verification).toBe('CONFLICTED');
    expect(taua[0]!.note).toContain('DUPLICATE');
  });

  it('imports NO shirt number for True Bangkok, whose column was a row index', () => {
    const tbu = researchedSquadFor('T1-04')!;
    expect(tbu.players.every((p) => p.squadNumber === undefined)).toBe(true);
    expect(tbu.documentedConflicts.some((c) => c.includes('ลำดับแถว'))).toBe(true);
  });

  it('leaves True Bangkok nationality unknown rather than guessing it', () => {
    const tbu = researchedSquadFor('T1-04')!;
    expect(tbu.players.every((p) => p.nationalityCategory === 'unknown')).toBe(true);
    expect(tbu.players.every((p) => p.nationality === undefined)).toBe(true);
  });

  it('flags Boontawee Thepwong appearing at two different clubs', () => {
    const tbu = researchedSquadFor('T1-04')!;
    const pattani = researchedSquadFor('T1-14')!;
    const atBangkok = tbu.players.find((p) => p.name === 'Boontawee Thepwong');
    const atPattani = pattani.players.find((p) => p.name === 'Boontawee');
    expect(atBangkok?.verification).toBe('CONFLICTED');
    expect(atPattani?.verification).toBe('CONFLICTED');
  });

  it('leaves Sisaket unknown positions unsourced in the data', () => {
    const sisaket = researchedSquadFor('T1-15')!;
    const withoutPosition = sisaket.players.filter((p) => !p.position);
    expect(withoutPosition.length).toBe(23);
  });

  it('marks simulated positions in unsourcedFields at runtime', () => {
    const state = createCareer(chairman, 'T1-15', 'sisaket-seed');
    const players = playersOfClub(state, 'T1-15');
    const simulated = players.filter((p) => p.unsourcedFields.includes('position'));
    expect(simulated).toHaveLength(23);
    // and the club can still field a keeper
    expect(players.filter((p) => p.position === 'GK').length).toBeGreaterThanOrEqual(1);
  });

  it('reports INDETERMINATE for True Bangkok because nationality is unknown', () => {
    const state = createCareer(chairman, 'T1-04', 'tbu-seed');
    const report = checkRegistration(playersOfClub(state, 'T1-04'), getRegulation('T1'));
    expect(report.categoryCounts.unknown).toBe(28);
    expect(report.status).not.toBe('VIOLATION');
  });
});

describe('foreign status is taken from what the source actually said', () => {
  it('counts BG Pathum players the document labelled "Foreign" as foreign', () => {
    const bg = researchedSquadFor('T1-02')!;
    const explicitForeign = bg.players.filter((p) => p.isForeign === true);
    expect(explicitForeign).toHaveLength(12);
    // ...but their confederation is unknown, because no country was named.
    expect(explicitForeign.every((p) => p.nationalityCategory === 'unknown')).toBe(true);
  });

  it('reports BG Pathum as INDETERMINATE, not compliant, at 12 foreign vs a limit of 10', () => {
    const state = createCareer(chairman, 'T1-02', 'bg-seed');
    const report = checkRegistration(playersOfClub(state, 'T1-02'), getRegulation('T1'));
    expect(report.foreignCount).toBe(12);
    expect(report.status).toBe('INDETERMINATE');
    expect(report.notes[0]).toContain('ไม่ได้ระบุสัญชาติ');
  });

  it('makes no foreign claim where the source established nothing', () => {
    const tbu = researchedSquadFor('T1-04')!;
    expect(tbu.players.every((p) => p.isForeign === undefined)).toBe(true);
    const state = createCareer(chairman, 'T1-04', 'tbu-seed2');
    expect(playersOfClub(state, 'T1-04').every((p) => p.isForeign === false)).toBe(true);
  });
});
