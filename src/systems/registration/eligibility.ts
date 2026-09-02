import type { Player } from '../../core/player';
import type { CompetitionRegulation } from '../../core/regulation';
import { isEnforceable } from '../../core/regulation';

/**
 * REGISTRATION SYSTEM. Every limit is read from CompetitionRegulation — there
 * is not a single hard-coded foreign-player number in this file (brief §8).
 * Changing regulations.data.ts changes behaviour here with no code edit.
 */
export interface EligibilityReport {
  compliant: boolean;
  foreignCount: number;
  foreignLimit: number | null;
  /** True when the rule was skipped because the real regulation is unknown. */
  ruleEnforced: boolean;
  violations: string[];
}

export function checkRegistration(
  players: readonly Player[],
  regulation: CompetitionRegulation,
): EligibilityReport {
  const rule = regulation.foreignRegistrationMax;
  const foreign = players.filter((p) => p.isForeign).length;
  const enforced = isEnforceable(rule);
  const violations: string[] = [];

  if (enforced && rule.value !== null && foreign > rule.value) {
    violations.push(
      `ผู้เล่นต่างชาติที่ลงทะเบียน ${foreign} คน เกินโควตา ${rule.value} คน`,
    );
  }

  return {
    compliant: violations.length === 0,
    foreignCount: foreign,
    foreignLimit: rule.value,
    ruleEnforced: enforced,
    violations,
  };
}

export function checkMatchdaySquad(
  players: readonly Player[],
  regulation: CompetitionRegulation,
): EligibilityReport {
  const rule = regulation.foreignMatchdayMax;
  const foreign = players.filter((p) => p.isForeign).length;
  const enforced = isEnforceable(rule);
  const violations: string[] = [];

  if (enforced && rule.value !== null && foreign > rule.value) {
    violations.push(
      `ผู้เล่นต่างชาติในวันแข่ง ${foreign} คน เกินโควตา ${rule.value} คน`,
    );
  }

  return {
    compliant: violations.length === 0,
    foreignCount: foreign,
    foreignLimit: rule.value,
    ruleEnforced: enforced,
    violations,
  };
}

/**
 * Caps a candidate matchday selection to the configured foreign limit.
 * When the limit is UNKNOWN the selection passes through untouched rather
 * than an invented number being applied (brief §17 uncertain-rules condition).
 */
export function applyForeignMatchdayCap(
  selection: readonly Player[],
  bench: readonly Player[],
  regulation: CompetitionRegulation,
): Player[] {
  const rule = regulation.foreignMatchdayMax;
  if (!isEnforceable(rule) || rule.value === null) return [...selection];

  const limit = rule.value;
  const result = [...selection];
  const replacements = [...bench]
    .filter((p) => !p.isForeign)
    .sort((a, b) => b.ability - a.ability);

  let foreign = result.filter((p) => p.isForeign).length;
  while (foreign > limit && replacements.length > 0) {
    // Drop the weakest foreign player, promote the best domestic replacement.
    let weakestIdx = -1;
    let weakest = Infinity;
    for (let i = 0; i < result.length; i += 1) {
      const p = result[i] as Player;
      if (p.isForeign && p.ability < weakest) {
        weakest = p.ability;
        weakestIdx = i;
      }
    }
    if (weakestIdx === -1) break;
    const replacement = replacements.shift();
    if (!replacement) break;
    result[weakestIdx] = replacement;
    foreign -= 1;
  }
  return result;
}
