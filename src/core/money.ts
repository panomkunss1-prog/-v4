/** Thai baht, stored as whole baht integers to avoid float drift. */
export type Baht = number;

export const baht = (amount: number): Baht => Math.round(amount);

export const millionBaht = (amount: number): Baht => Math.round(amount * 1_000_000);

/** Presentation helper only; UI may format further but must not do arithmetic. */
export function formatBaht(amount: Baht): string {
  return `฿${Math.round(amount).toLocaleString('th-TH')}`;
}

export function formatBahtCompact(amount: Baht): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `฿${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `฿${(amount / 1_000).toFixed(0)}K`;
  return `฿${Math.round(amount)}`;
}
