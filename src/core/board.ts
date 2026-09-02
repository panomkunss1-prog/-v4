export type BoardObjectiveType =
  | 'league_position'
  | 'avoid_relegation'
  | 'financial_stability'
  | 'youth_development';

export interface BoardObjective {
  type: BoardObjectiveType;
  description: string;
  /** Interpreted per type: league position, or a rating threshold. */
  target: number;
}

export interface BoardState {
  objectives: BoardObjective[];
  /** 0..100 */
  confidence: number;
  patience: number;
}

export interface FanState {
  /** 0..100 */
  mood: number;
}
