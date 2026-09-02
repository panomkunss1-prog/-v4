import { describe, expect, it } from 'vitest';
import { createRng, seedFromString } from '../../src/core/rng';

describe('seeded rng', () => {
  it('produces an identical sequence for the same seed', () => {
    const a = createRng(12345);
    const b = createRng(12345);
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces a different sequence for a different seed', () => {
    const a = Array.from({ length: 20 }, ((r) => () => r.next())(createRng(1)));
    const b = Array.from({ length: 20 }, ((r) => () => r.next())(createRng(2)));
    expect(a).not.toEqual(b);
  });

  it('keeps int() inside the inclusive bounds', () => {
    const rng = createRng(99);
    for (let i = 0; i < 500; i += 1) {
      const value = rng.int(3, 7);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(7);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('throws rather than returning undefined when picking from an empty array', () => {
    expect(() => createRng(1).pick([])).toThrow();
  });

  it('derives a stable seed from a string', () => {
    expect(seedFromString('สมชาย:T1-01')).toBe(seedFromString('สมชาย:T1-01'));
    expect(seedFromString('a')).not.toBe(seedFromString('b'));
  });
});
