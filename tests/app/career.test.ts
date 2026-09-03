import { describe, expect, it } from 'vitest';
import { createCareer } from '../../src/app/newCareer';
import { buildAttributes } from '../../src/core/chairman';
import type { ChairmanProfile } from '../../src/core/chairman';
import { T1_CLUBS } from '../../src/data/clubs.seed';
import { checkRegistration } from '../../src/systems/registration/eligibility';
import { getRegulation } from '../../src/data/regulations.data';
import { playersOfClub } from '../../src/app/gameState';
import { SQUAD_SIZE } from '../../src/data/players.seed';

export const chairman: ChairmanProfile = {
  name: 'สมชาย ทดสอบ',
  background: 'businessperson',
  personality: 'ambitious',
  goal: 'promotion',
  attributes: buildAttributes('businessperson', 'ambitious'),
};

const clubId = T1_CLUBS[0]!.id;

describe('new career', () => {
  it('creates a complete, playable state', () => {
    const state = createCareer(chairman, clubId, 'seed-a');
    expect(state.playerClubId).toBe(clubId);
    expect(state.season.competitionId).toBe('T1');
    expect(state.season.participantIds).toHaveLength(16);
    expect(state.season.currentMatchday).toBe(1);
    expect(state.season.totalMatchdays).toBe(30);
    expect(state.fixtures).toHaveLength(240);
    expect(state.results).toHaveLength(0);
  });

  it('gives every club a manager and a squad', () => {
    const state = createCareer(chairman, clubId, 'seed-a');
    for (const id of state.season.participantIds) {
      expect(state.managers[id]).toBeDefined();
      // Fictional clubs get the standard 22; a club with an approved
      // researched squad keeps its real size instead.
      const squad = playersOfClub(state, id);
      const researched = squad.some((p) => p.verification !== 'FICTIONAL');
      expect(squad.length).toBe(researched ? squad.length : SQUAD_SIZE);
      expect(squad.length).toBeGreaterThanOrEqual(11);
    }
  });

  it('never reports a FALSE registration violation for a real squad', () => {
    const state = createCareer(chairman, clubId, 'seed-a');
    const reg = getRegulation('T1');
    for (const id of state.season.participantIds) {
      const report = checkRegistration(playersOfClub(state, id), reg);
      // A researched squad may legitimately exceed the flat foreign limit
      // because ASEAN/Asian quotas are counted separately in reality and
      // are UNKNOWN here — that must read as INDETERMINATE, never VIOLATION.
      expect(report.status).not.toBe('VIOLATION');
    }
  });

  it('keeps fictional squads strictly compliant', () => {
    const state = createCareer(chairman, clubId, 'seed-a');
    const reg = getRegulation('T1');
    for (const id of state.season.participantIds) {
      const squad = playersOfClub(state, id);
      if (squad.every((p) => p.verification === 'FICTIONAL')) {
        expect(checkRegistration(squad, reg).status).toBe('COMPLIANT');
      }
    }
  });

  it('is fully reproducible from the same seed text', () => {
    expect(createCareer(chairman, clubId, 'same')).toEqual(createCareer(chairman, clubId, 'same'));
  });

  it('produces a different career for a different seed text', () => {
    const a = createCareer(chairman, clubId, 'one');
    const b = createCareer(chairman, clubId, 'two');
    expect(a.players).not.toEqual(b.players);
  });

  it('sets board objectives from the chairman goal', () => {
    const state = createCareer({ ...chairman, goal: 'win_title' }, clubId, 's');
    expect(state.board.objectives[0]?.target).toBe(3);
  });

  it('opens the books with a positive balance and a real wage bill', () => {
    const state = createCareer(chairman, clubId, 's');
    expect(state.finance.balance).toBeGreaterThan(0);
    expect(state.finance.weeklyWageBill).toBeGreaterThan(0);
  });

  it('does not store standings in saved state (derived only)', () => {
    const state = createCareer(chairman, clubId, 's');
    expect(Object.keys(state)).not.toContain('standings');
  });
});

describe('league position before any match', () => {
  it('reports no position rather than a meaningless #1', async () => {
    const { clubOverview } = await import('../../src/app/clubOverview');
    const state = createCareer(chairman, clubId, 'position-seed');
    expect(clubOverview(state).leaguePosition).toBe(0);
  });
});

describe('club roster integrity', () => {
  it('has the correct club counts and real stadium identities per tier', async () => {
    const { T1_CLUBS, T2_CLUBS, T3_CLUBS, ROSTER_VERIFIED } = await import('../../src/data/clubs.seed');
    expect(T1_CLUBS).toHaveLength(16);
    expect(T2_CLUBS).toHaveLength(18);
    expect(T3_CLUBS).toHaveLength(69);
    expect(ROSTER_VERIFIED.T1).toBe(true);
    expect(ROSTER_VERIFIED.T2).toBe(true);
    expect(ROSTER_VERIFIED.T3).toBe(false);
    for (const club of [...T1_CLUBS, ...T2_CLUBS, ...T3_CLUBS]) {
      expect(club.stadiumName.length).toBeGreaterThan(0);
      expect(club.trainingFacilityLevel).toBeGreaterThanOrEqual(1);
      expect(club.trainingFacilityLevel).toBeLessThanOrEqual(5);
    }
  });

  it('gives every club a unique id', async () => {
    const { ALL_CLUBS } = await import('../../src/data/clubs.seed');
    expect(new Set(ALL_CLUBS.map((c) => c.id)).size).toBe(ALL_CLUBS.length);
  });
});

describe('careers across all three tiers', () => {
  it('builds a valid T2 career (18 clubs)', () => {
    const state = createCareer(chairman, 'T2-01', 'seed-t2');
    expect(state.season.competitionId).toBe('T2');
    expect(state.season.participantIds).toHaveLength(18);
    expect(state.fixtures.length).toBeGreaterThan(0);
  });

  it('builds a T3 career as a regional zone, not a 69-club table', () => {
    const state = createCareer(chairman, 'T3-01', 'seed-t3');
    expect(state.season.competitionId).toBe('T3');
    expect(state.season.zone).toBeTruthy();
    // The player plays their zone: roughly a dozen clubs, a sane season
    // length — not 69 clubs and 138 matchdays.
    expect(state.season.participantIds.length).toBeGreaterThanOrEqual(10);
    expect(state.season.participantIds.length).toBeLessThanOrEqual(12);
    expect(state.season.totalMatchdays).toBeLessThanOrEqual(24);
    for (const clubId of state.season.participantIds) {
      expect(state.clubs[clubId]!.zone).toBe(state.season.zone);
    }
  });

  it('still records the whole pyramid in league membership', () => {
    const state = createCareer(chairman, 'T3-01', 'seed-t3');
    expect(state.leagueMembership.T1).toHaveLength(16);
    expect(state.leagueMembership.T2).toHaveLength(18);
    expect(state.leagueMembership.T3).toHaveLength(69);
  });

  it('advances a T3 matchday correctly despite the large club count', async () => {
    const { advanceMatchday } = await import('../../src/app/advanceMatchday');
    const state = createCareer(chairman, 'T3-01', 'seed-t3-advance');
    const result = advanceMatchday(state);
    if (!result.ok) throw new Error(result.error);
    expect(result.value.results.length).toBeGreaterThan(0);
    expect(result.value.season.currentMatchday).toBe(2);
  });
});
