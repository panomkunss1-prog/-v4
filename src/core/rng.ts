/**
 * Deterministic seeded PRNG (mulberry32).
 *
 * There is exactly ONE random source in the prototype. It is created per
 * career and injected into every system that needs randomness, so any run can
 * be reproduced from its seed. Never call Math.random() in core or systems.
 */
export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** Uniform float in [min, max). */
  float(min: number, max: number): number;
  /** Picks one element; throws on an empty array. */
  pick<T>(items: readonly T[]): T;
  /** Returns true with the given probability (0..1). */
  chance(probability: number): boolean;
  /** Current internal state, so a run can be saved and resumed exactly. */
  state(): number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    float: (min, max) => min + next() * (max - min),
    pick: <T,>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error('rng.pick called with an empty array');
      return items[Math.floor(next() * items.length)] as T;
    },
    chance: (probability) => next() < probability,
    state: () => s,
  };
}

/** Derives a stable seed from a string, so a career name always seeds alike. */
export function seedFromString(text: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
