import { clamp } from './result';

/** Brief §4 / CHAIRMAN CHARACTER. The player is the chairman, never a manager. */
export type ChairmanBackground =
  | 'businessperson'
  | 'former_footballer'
  | 'corporate_executive'
  | 'supporter_founder'
  | 'business_heir';

export type ChairmanPersonality =
  | 'ambitious'
  | 'patient'
  | 'risk_taker'
  | 'financial_conservative';

export type ChairmanGoal =
  | 'promotion'
  | 'build_academy'
  | 'turn_profit'
  | 'win_title';

export const CHAIRMAN_ATTRIBUTE_KEYS = [
  'leadership',
  'footballKnowledge',
  'business',
  'finance',
  'negotiation',
  'networking',
  'reputation',
  'strategicVision',
] as const;

export type ChairmanAttributeKey = (typeof CHAIRMAN_ATTRIBUTE_KEYS)[number];

export type ChairmanAttributes = Record<ChairmanAttributeKey, number>;

export interface ChairmanProfile {
  name: string;
  background: ChairmanBackground;
  personality: ChairmanPersonality;
  goal: ChairmanGoal;
  attributes: ChairmanAttributes;
}

export const ATTRIBUTE_MIN = 1;
export const ATTRIBUTE_MAX = 20;
/** Every chairman starts from the same pool, so builds are comparable. */
export const ATTRIBUTE_BASE = 8;

/** Background bonuses applied on top of ATTRIBUTE_BASE. */
export const BACKGROUND_BONUS: Record<ChairmanBackground, Partial<ChairmanAttributes>> = {
  businessperson: { business: 5, finance: 4, negotiation: 3 },
  former_footballer: { footballKnowledge: 6, reputation: 3, networking: 2 },
  corporate_executive: { leadership: 5, strategicVision: 4, business: 3 },
  supporter_founder: { leadership: 3, reputation: 2, footballKnowledge: 3, networking: 3 },
  business_heir: { finance: 5, business: 3, networking: 4, reputation: 2 },
};

export const PERSONALITY_BONUS: Record<ChairmanPersonality, Partial<ChairmanAttributes>> = {
  ambitious: { strategicVision: 2, leadership: 1 },
  patient: { leadership: 2, strategicVision: 1 },
  risk_taker: { negotiation: 2, business: 1 },
  financial_conservative: { finance: 2, business: 1 },
};

export function buildAttributes(
  background: ChairmanBackground,
  personality: ChairmanPersonality,
): ChairmanAttributes {
  const attributes = Object.fromEntries(
    CHAIRMAN_ATTRIBUTE_KEYS.map((key) => [key, ATTRIBUTE_BASE]),
  ) as ChairmanAttributes;

  for (const [key, bonus] of Object.entries(BACKGROUND_BONUS[background])) {
    attributes[key as ChairmanAttributeKey] += bonus ?? 0;
  }
  for (const [key, bonus] of Object.entries(PERSONALITY_BONUS[personality])) {
    attributes[key as ChairmanAttributeKey] += bonus ?? 0;
  }
  for (const key of CHAIRMAN_ATTRIBUTE_KEYS) {
    attributes[key] = clamp(attributes[key], ATTRIBUTE_MIN, ATTRIBUTE_MAX);
  }
  return attributes;
}
