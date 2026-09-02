import type { Baht } from '../../core/money';
import type { FinanceState, LedgerCategory, LedgerEntry } from '../../core/finance';
import type { Club } from '../../core/club';

/** FINANCE SYSTEM owns club money. Nothing else mutates FinanceState. */
export function post(
  finance: FinanceState,
  matchday: number,
  category: LedgerCategory,
  amount: Baht,
  description: string,
): FinanceState {
  const entry: LedgerEntry = { matchday, category, amount, description };
  return {
    ...finance,
    balance: finance.balance + amount,
    ledger: [...finance.ledger, entry],
  };
}

/** Matchday revenue scales with attendance, which is capped by the stadium. */
export function matchdayRevenue(club: Club, fanMood: number): Baht {
  const attendance = Math.min(
    club.stadiumCapacity,
    Math.round(club.fanbase * (0.55 + fanMood / 160)),
  );
  return Math.round(attendance * 220);
}

export function sponsorshipRevenue(club: Club): Baht {
  return Math.round(club.reputation * 180_000 + club.fanbase * 20);
}

/** Applies a matchday's recurring income and costs in one pass. */
export function applyMatchdayFinances(
  finance: FinanceState,
  club: Club,
  matchday: number,
  isHome: boolean,
  fanMood: number,
): FinanceState {
  let next = post(finance, matchday, 'wages', -finance.weeklyWageBill, 'ค่าเหนื่อยนักเตะและสตาฟ');
  next = post(next, matchday, 'sponsorship', sponsorshipRevenue(club), 'รายได้สปอนเซอร์');
  if (isHome) {
    next = post(next, matchday, 'matchday_revenue', matchdayRevenue(club, fanMood), 'รายได้วันแข่งเหย้า');
  }
  next = post(next, matchday, 'operating_cost', -Math.round(club.stadiumCapacity * 18), 'ค่าดำเนินงาน');
  return next;
}
