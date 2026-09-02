/** Explicit success/failure without exceptions, so rules stay portable. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const ok = <T,>(value: T): Result<T> => ({ ok: true, value });
export const err = <T = never,>(error: string): Result<T> => ({ ok: false, error });

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
