import { describe, expect, it } from 'vitest';
import { scheduledEventsForMatchday } from '../../src/systems/calendar/events';

describe('scheduled executive events', () => {
  it('always opens the season with a season-category event on matchday 1', () => {
    const events = scheduledEventsForMatchday(1, 30);
    expect(events.some((e) => e.category === 'season')).toBe(true);
  });

  it('is deterministic for identical inputs', () => {
    expect(scheduledEventsForMatchday(15, 30)).toEqual(scheduledEventsForMatchday(15, 30));
  });

  it('produces no events for an arbitrary non-milestone matchday', () => {
    expect(scheduledEventsForMatchday(2, 30)).toEqual([]);
  });

  it('produces quarter/half/three-quarter milestones for a 30-matchday season', () => {
    const md8 = scheduledEventsForMatchday(8, 30); // round(30/4)=8
    const md15 = scheduledEventsForMatchday(15, 30); // round(30/2)=15
    const md23 = scheduledEventsForMatchday(23, 30); // round(30*3/4)=23 (previously called round(22.5))
    expect(md8.some((e) => e.category === 'board')).toBe(true);
    expect(md15.some((e) => e.category === 'sponsor')).toBe(true);
    expect(md23.some((e) => e.category === 'board')).toBe(true);
  });

  it('never touches tactical/match-control categories', () => {
    for (let md = 1; md <= 30; md += 1) {
      for (const event of scheduledEventsForMatchday(md, 30)) {
        expect(['season', 'board', 'finance', 'sponsor', 'match', 'squad']).toContain(event.category);
      }
    }
  });

  it('does not crash for a very short season (e.g. a small T3 zone)', () => {
    expect(() => {
      for (let md = 1; md <= 3; md += 1) scheduledEventsForMatchday(md, 3);
    }).not.toThrow();
  });
});
