import { describe, expect, it } from 'vitest';
import { compareDates } from '../../src/core/gameDate';
import { dateForMatchday, seasonAnchorDate } from '../../src/systems/calendar/seasonCalendar';

describe('season calendar', () => {
  it('places matchday 1 exactly on the season anchor', () => {
    expect(dateForMatchday(2026, 1)).toEqual(seasonAnchorDate(2026));
  });

  it('is strictly increasing across a full 30-matchday season', () => {
    let previous = dateForMatchday(2026, 1);
    for (let md = 2; md <= 30; md += 1) {
      const current = dateForMatchday(2026, md);
      expect(compareDates(current, previous)).toBeGreaterThan(0);
      previous = current;
    }
  });

  it('spaces matchdays exactly one week apart', () => {
    const a = dateForMatchday(2026, 5);
    const b = dateForMatchday(2026, 6);
    expect(compareDates(b, a)).toBe(7);
  });

  it('is deterministic: identical inputs always give the identical date', () => {
    expect(dateForMatchday(2026, 15)).toEqual(dateForMatchday(2026, 15));
  });

  it('produces a different calendar for a different season year', () => {
    expect(dateForMatchday(2026, 1).year).toBe(2026);
    expect(dateForMatchday(2027, 1).year).toBe(2027);
  });
});
