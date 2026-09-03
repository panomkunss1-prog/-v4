import { describe, expect, it } from 'vitest';
import {
  addDays,
  compareDates,
  daysInMonth,
  formatGameDate,
  fromDayNumber,
  isBefore,
  isSameDate,
  toDayNumber,
  type GameDate,
} from '../../src/core/gameDate';

describe('GameDate arithmetic', () => {
  it('round-trips through day numbers for a range of dates', () => {
    const samples: GameDate[] = [
      { year: 2026, month: 1, day: 1 },
      { year: 2026, month: 12, day: 31 },
      { year: 2028, month: 2, day: 29 }, // leap year
      { year: 2100, month: 2, day: 28 }, // NOT a leap year (div by 100, not 400)
      { year: 2000, month: 2, day: 29 }, // IS a leap year (div by 400)
      { year: 2026, month: 8, day: 1 },
    ];
    for (const date of samples) {
      expect(fromDayNumber(toDayNumber(date))).toEqual(date);
    }
  });

  it('knows correct days-in-month including leap years', () => {
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 1)).toBe(31);
  });

  it('adds days correctly across a month boundary', () => {
    expect(addDays({ year: 2026, month: 1, day: 30 }, 5)).toEqual({ year: 2026, month: 2, day: 4 });
  });

  it('adds days correctly across a year boundary', () => {
    expect(addDays({ year: 2026, month: 12, day: 28 }, 7)).toEqual({ year: 2027, month: 1, day: 4 });
  });

  it('adds days correctly across a leap-year February', () => {
    expect(addDays({ year: 2028, month: 2, day: 27 }, 3)).toEqual({ year: 2028, month: 3, day: 1 });
  });

  it('handles negative day deltas', () => {
    expect(addDays({ year: 2026, month: 3, day: 1 }, -1)).toEqual({ year: 2026, month: 2, day: 28 });
  });

  it('orders dates correctly', () => {
    const a = { year: 2026, month: 8, day: 1 };
    const b = { year: 2026, month: 8, day: 8 };
    expect(isBefore(a, b)).toBe(true);
    expect(isBefore(b, a)).toBe(false);
    expect(compareDates(a, b)).toBeLessThan(0);
    expect(isSameDate(a, { ...a })).toBe(true);
  });

  it('formats a date in Thai with an abbreviated month', () => {
    expect(formatGameDate({ year: 2026, month: 8, day: 1 })).toBe('1 ส.ค. 2026');
    expect(formatGameDate({ year: 2027, month: 1, day: 15 })).toBe('15 ม.ค. 2027');
  });
});
