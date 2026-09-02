import { describe, expect, it } from 'vitest';
import { applyMatchdayFinances, matchdayRevenue, post, sponsorshipRevenue } from '../../src/systems/finance/ledger';
import type { FinanceState } from '../../src/core/finance';
import { T1_CLUBS } from '../../src/data/clubs.seed';

const club = T1_CLUBS[0]!;
const base: FinanceState = {
  balance: 10_000_000,
  transferBudget: 1_000_000,
  wageBudget: 500_000,
  weeklyWageBill: 250_000,
  ledger: [],
};

describe('finance ledger', () => {
  it('moves the balance by the posted amount and records the entry', () => {
    const next = post(base, 1, 'sponsorship', 500_000, 'test');
    expect(next.balance).toBe(10_500_000);
    expect(next.ledger).toHaveLength(1);
    expect(next.ledger[0]).toMatchObject({ category: 'sponsorship', amount: 500_000 });
  });

  it('does not mutate the input state', () => {
    post(base, 1, 'wages', -100, 'test');
    expect(base.balance).toBe(10_000_000);
    expect(base.ledger).toHaveLength(0);
  });

  it('debits expenses as negative amounts', () => {
    const next = post(base, 1, 'wages', -250_000, 'wages');
    expect(next.balance).toBe(9_750_000);
  });

  it('caps matchday attendance at stadium capacity', () => {
    const packed = { ...club, fanbase: 10_000_000 };
    expect(matchdayRevenue(packed, 100)).toBe(packed.stadiumCapacity * 220);
  });

  it('raises matchday revenue when fans are happier', () => {
    expect(matchdayRevenue(club, 90)).toBeGreaterThan(matchdayRevenue(club, 20));
  });

  it('charges wages every matchday, home or away', () => {
    const home = applyMatchdayFinances(base, club, 1, true, 60);
    const away = applyMatchdayFinances(base, club, 1, false, 60);
    expect(home.ledger.some((e) => e.category === 'wages' && e.amount === -250_000)).toBe(true);
    expect(away.ledger.some((e) => e.category === 'wages' && e.amount === -250_000)).toBe(true);
  });

  it('only books matchday gate revenue for home fixtures', () => {
    const home = applyMatchdayFinances(base, club, 1, true, 60);
    const away = applyMatchdayFinances(base, club, 1, false, 60);
    expect(home.ledger.some((e) => e.category === 'matchday_revenue')).toBe(true);
    expect(away.ledger.some((e) => e.category === 'matchday_revenue')).toBe(false);
    expect(home.balance).toBeGreaterThan(away.balance);
  });

  it('scales sponsorship with club reputation', () => {
    const bigger = { ...club, reputation: club.reputation + 5 };
    expect(sponsorshipRevenue(bigger)).toBeGreaterThan(sponsorshipRevenue(club));
  });

  it('keeps the balance equal to the sum of every ledger entry', () => {
    let state = base;
    for (let day = 1; day <= 5; day += 1) {
      state = applyMatchdayFinances(state, club, day, day % 2 === 0, 60);
    }
    const ledgerSum = state.ledger.reduce((s, e) => s + e.amount, 0);
    expect(state.balance).toBe(base.balance + ledgerSum);
  });
});
