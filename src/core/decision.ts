import type { DecisionId } from './ids';
import type { Baht } from './money';
import type { FinancialStrategy } from './finance';
import type { BoardObjectiveType } from './board';

/**
 * Brief §5 / EXECUTIVE DECISIONS. Every decision here is an ORGANISATIONAL
 * lever. None of them touches team selection, formation, tactics or in-match
 * actions — that boundary is what keeps this out of Manager Mode.
 */
export type DecisionType =
  | 'budget_allocation'
  | 'academy_investment'
  | 'facilities_investment'
  | 'stadium_investment'
  | 'financial_strategy'
  | 'board_objective'
  | 'appoint_manager'
  | 'dismiss_manager'
  | 'manager_contract'
  | 'transfer_approval';

export interface DecisionParams {
  transferBudget?: Baht;
  wageBudget?: Baht;
  investment?: Baht;
  strategy?: FinancialStrategy;
  objectiveType?: BoardObjectiveType;
  objectiveTarget?: number;
}

export interface ConsequenceEffect {
  /** Which system's state moved, for the consequence display. */
  system: 'finance' | 'board' | 'fans' | 'manager' | 'club';
  label: string;
  before: number;
  after: number;
}

export interface ExecutiveDecision {
  id: DecisionId;
  type: DecisionType;
  params: DecisionParams;
  appliedOnMatchday: number;
  cost: Baht;
  summary: string;
  effects: ConsequenceEffect[];
}
