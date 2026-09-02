import type { Baht } from './money';

export type LedgerCategory =
  | 'matchday_revenue'
  | 'sponsorship'
  | 'prize_money'
  | 'wages'
  | 'transfer'
  | 'academy_investment'
  | 'facilities_investment'
  | 'stadium_investment'
  | 'operating_cost';

export interface LedgerEntry {
  matchday: number;
  category: LedgerCategory;
  /** Positive = income, negative = expense. */
  amount: Baht;
  description: string;
}

export interface FinanceState {
  balance: Baht;
  transferBudget: Baht;
  wageBudget: Baht;
  /** Recurring per-matchday wage cost derived from the squad. */
  weeklyWageBill: Baht;
  ledger: LedgerEntry[];
}

export type FinancialStrategy = 'conservative' | 'balanced' | 'aggressive';
