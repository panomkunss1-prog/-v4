import { describe, expect, it } from 'vitest';
import { createCareer } from '../../src/app/newCareer';
import { advanceMatchday } from '../../src/app/advanceMatchday';
import { advanceGameClock, markInboxRead, previewUpcoming } from '../../src/app/gameClock';
import { buildAttributes, type ChairmanProfile } from '../../src/core/chairman';
import { compareDates } from '../../src/core/gameDate';
import type { GameState } from '../../src/app/gameState';

const chairman: ChairmanProfile = {
  name: 'ทดสอบ นาฬิกาเกม',
  background: 'corporate_executive',
  personality: 'patient',
  goal: 'promotion',
  attributes: buildAttributes('corporate_executive', 'patient'),
};

const fresh = () => createCareer(chairman, 'T1-01', 'clock-seed');

describe('advanceGameClock', () => {
  it('produces IDENTICAL league/match/finance/board state to calling advanceMatchday directly', () => {
    // This is the load-bearing guarantee: NEXT must never diverge from the
    // existing authoritative pipeline it delegates to.
    const before = fresh();
    const viaClock = advanceGameClock(before);
    const viaDirect = advanceMatchday(before);
    if (!viaClock.ok || !viaDirect.ok) throw new Error('expected both to succeed');

    // Compare everything EXCEPT the two new fields the clock itself owns.
    const { currentDate: _d1, inbox: _i1, ...clockRest } = viaClock.value;
    const { currentDate: _d2, inbox: _i2, ...directRest } = viaDirect.value;
    expect(clockRest).toEqual(directRest);
  });

  it('advances the visible date forward', () => {
    const before = fresh();
    const result = advanceGameClock(before);
    if (!result.ok) throw new Error(result.error);
    expect(compareDates(result.value.currentDate, before.currentDate)).toBeGreaterThan(0);
  });

  it('adds a match-result inbox item every time the own club plays', () => {
    const result = advanceGameClock(fresh());
    if (!result.ok) throw new Error(result.error);
    const matchItems = result.value.inbox.filter((i) => i.category === 'match');
    expect(matchItems).toHaveLength(1);
    expect(matchItems[0]!.read).toBe(false);
  });

  it('adds the season-open scheduled event on matchday 1', () => {
    const result = advanceGameClock(fresh());
    if (!result.ok) throw new Error(result.error);
    expect(result.value.inbox.some((i) => i.category === 'season')).toBe(true);
  });

  it('accumulates inbox items across multiple NEXT presses rather than replacing them', () => {
    let state: GameState = fresh();
    for (let i = 0; i < 3; i += 1) {
      const result = advanceGameClock(state);
      if (!result.ok) throw new Error(result.error);
      state = result.value;
    }
    // At least 3 match results, one per matchday played.
    expect(state.inbox.filter((i) => i.category === 'match')).toHaveLength(3);
  });

  it('refuses to advance a completed season, same as advanceMatchday', () => {
    let state: GameState = fresh();
    while (state.season.status !== 'complete') {
      const result = advanceGameClock(state);
      if (!result.ok) throw new Error(result.error);
      state = result.value;
    }
    const beyond = advanceGameClock(state);
    expect(beyond.ok).toBe(false);
  });

  it('is deterministic: replaying the same career produces the same inbox', () => {
    const run = () => {
      let state = fresh();
      for (let i = 0; i < 5; i += 1) {
        const result = advanceGameClock(state);
        if (!result.ok) throw new Error(result.error);
        state = result.value;
      }
      return state;
    };
    const a = run();
    const b = run();
    expect(a.inbox).toEqual(b.inbox);
    expect(a.currentDate).toEqual(b.currentDate);
  });

  it('can drive a full season to completion through NEXT alone', () => {
    let state: GameState = fresh();
    let ticks = 0;
    while (state.season.status !== 'complete' && ticks < 40) {
      const result = advanceGameClock(state);
      if (!result.ok) throw new Error(result.error);
      state = result.value;
      ticks += 1;
    }
    expect(state.season.status).toBe('complete');
    expect(ticks).toBe(30);
  });
});

describe('markInboxRead', () => {
  it('marks only the targeted item as read', () => {
    const result = advanceGameClock(fresh());
    if (!result.ok) throw new Error(result.error);
    const targetId = result.value.inbox[0]!.id;
    const after = markInboxRead(result.value, targetId);
    expect(after.inbox.find((i) => i.id === targetId)?.read).toBe(true);
    const others = after.inbox.filter((i) => i.id !== targetId);
    expect(others.every((i) => i.read === result.value.inbox.find((x) => x.id === i.id)?.read)).toBe(true);
  });
});

describe('previewUpcoming', () => {
  it('previews the next opponent without mutating state or playing the match', () => {
    const before = fresh();
    const preview = previewUpcoming(before);
    expect(preview).not.toBeNull();
    expect(preview!.matchday).toBe(1);
    expect(preview!.opponentClubId).not.toBe(before.playerClubId);
    // Nothing was played — no results recorded.
    expect(before.results).toHaveLength(0);
  });

  it('returns null once the season is complete', () => {
    let state: GameState = fresh();
    while (state.season.status !== 'complete') {
      const result = advanceGameClock(state);
      if (!result.ok) throw new Error(result.error);
      state = result.value;
    }
    expect(previewUpcoming(state)).toBeNull();
  });

  it('matches the date advanceGameClock will actually land on', () => {
    const before = fresh();
    const preview = previewUpcoming(before);
    const result = advanceGameClock(before);
    if (!result.ok) throw new Error(result.error);
    expect(preview!.date).toEqual(result.value.currentDate);
  });
});
