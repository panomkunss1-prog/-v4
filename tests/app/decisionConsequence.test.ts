import { describe, expect, it } from 'vitest';
import { applyDecision } from '../../src/app/applyDecision';
import { createCareer } from '../../src/app/newCareer';
import { buildAttributes } from '../../src/core/chairman';
import type { ChairmanProfile } from '../../src/core/chairman';
import { T1_CLUBS } from '../../src/data/clubs.seed';
import { playerClub } from '../../src/app/gameState';

const chairman: ChairmanProfile = {
  name: 'ทดสอบ ผลลัพธ์',
  background: 'businessperson',
  personality: 'ambitious',
  goal: 'promotion',
  attributes: buildAttributes('businessperson', 'ambitious'),
};

const fresh = () => createCareer(chairman, T1_CLUBS[0]!.id, 'decision-seed');

describe('budget allocation decision', () => {
  it('increases the transfer budget by exactly the allocated amount', () => {
    const before = fresh();
    const result = applyDecision(before, 'budget_allocation', { transferBudget: 5_000_000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.finance.transferBudget).toBe(before.finance.transferBudget + 5_000_000);
  });

  it('records the decision with a non-empty consequence list', () => {
    const result = applyDecision(fresh(), 'budget_allocation', { transferBudget: 5_000_000 });
    if (!result.ok) throw new Error(result.error);
    expect(result.value.decisions).toHaveLength(1);
    const decision = result.value.decisions[0]!;
    expect(decision.type).toBe('budget_allocation');
    expect(decision.effects.length).toBeGreaterThan(0);
    // Every effect must show a real before/after movement or an explicit hold.
    for (const e of decision.effects) {
      expect(typeof e.before).toBe('number');
      expect(typeof e.after).toBe('number');
    }
  });

  it('moves fan mood when serious money is committed', () => {
    const before = fresh();
    const result = applyDecision(before, 'budget_allocation', { transferBudget: 20_000_000 });
    if (!result.ok) throw new Error(result.error);
    expect(result.value.fans.mood).toBeGreaterThan(before.fans.mood);
  });

  it('rejects an allocation larger than the club balance', () => {
    const before = fresh();
    const result = applyDecision(before, 'budget_allocation', {
      transferBudget: before.finance.balance + 1,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a zero or negative allocation', () => {
    expect(applyDecision(fresh(), 'budget_allocation', { transferBudget: 0 }).ok).toBe(false);
    expect(applyDecision(fresh(), 'budget_allocation', { transferBudget: -5 }).ok).toBe(false);
  });

  it('leaves the original state untouched (immutability)', () => {
    const before = fresh();
    const budgetBefore = before.finance.transferBudget;
    applyDecision(before, 'budget_allocation', { transferBudget: 5_000_000 });
    expect(before.finance.transferBudget).toBe(budgetBefore);
    expect(before.decisions).toHaveLength(0);
  });
});

describe('academy investment decision', () => {
  it('debits cash and raises the club academy rating', () => {
    const before = fresh();
    const result = applyDecision(before, 'academy_investment', { investment: 8_000_000 });
    if (!result.ok) throw new Error(result.error);
    expect(result.value.finance.balance).toBe(before.finance.balance - 8_000_000);
    expect(playerClub(result.value).academy).toBeGreaterThan(playerClub(before).academy);
  });

  it('writes a ledger entry for the spend', () => {
    const result = applyDecision(fresh(), 'academy_investment', { investment: 8_000_000 });
    if (!result.ok) throw new Error(result.error);
    expect(result.value.finance.ledger.some((e) => e.category === 'academy_investment')).toBe(true);
  });

  it('rejects an investment too small to move the rating', () => {
    expect(applyDecision(fresh(), 'academy_investment', { investment: 100 }).ok).toBe(false);
  });
});

describe('unwired decision types', () => {
  it('are rejected explicitly rather than silently ignored', () => {
    const result = applyDecision(fresh(), 'manager_contract', { investment: 1_000_000 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('Slice 1');
  });
});

describe('stadium investment decision', () => {
  it('increases stadium capacity and debits the balance', () => {
    const before = fresh();
    const result = applyDecision(before, 'stadium_investment', { investment: 35_000_000 });
    if (!result.ok) throw new Error(result.error);
    expect(playerClub(result.value).stadiumCapacity).toBeGreaterThan(playerClub(before).stadiumCapacity);
    expect(result.value.finance.balance).toBeLessThan(before.finance.balance);
  });
});

describe('training facility investment decision', () => {
  it('increases the training facility level and debits the balance', () => {
    const before = fresh();
    const result = applyDecision(before, 'facilities_investment', { investment: 12_000_000 });
    if (!result.ok) throw new Error(result.error);
    expect(playerClub(result.value).trainingFacilityLevel).toBeGreaterThan(
      playerClub(before).trainingFacilityLevel,
    );
    expect(result.value.finance.balance).toBeLessThan(before.finance.balance);
  });
});

describe('sign sponsor decision', () => {
  it('signs the requested offer and removes it from the offer list', () => {
    const before = fresh();
    const offer = before.sponsorOffers[0]!;
    const result = applyDecision(before, 'sign_sponsor', { sponsorOfferId: offer.id });
    if (!result.ok) throw new Error(result.error);
    expect(result.value.sponsors).toHaveLength(1);
    expect(result.value.sponsors[0]).toMatchObject({ id: offer.id, name: offer.name });
    expect(result.value.sponsorOffers.some((o) => o.id === offer.id)).toBe(false);
  });

  it('rejects signing an offer that no longer exists', () => {
    const result = applyDecision(fresh(), 'sign_sponsor', { sponsorOfferId: 'nonexistent' });
    expect(result.ok).toBe(false);
  });

  it('refuses an 11th sponsor with an explicit error, never a silent cap', () => {
    const before = fresh();
    const tenSponsors = Array.from({ length: 10 }, (_, i) => ({
      id: `S${i}`,
      name: `Sponsor ${i}`,
      tier: 'small' as const,
      incomePerMatchday: 10000,
      signedOnMatchday: 1,
    }));
    const full = { ...before, sponsors: tenSponsors };
    const offer = full.sponsorOffers[0]!;
    const result = applyDecision(full, 'sign_sponsor', { sponsorOfferId: offer.id });
    expect(result.ok).toBe(false);
  });
});
