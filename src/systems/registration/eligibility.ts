import type { Player } from '../../core/player';
import type { CompetitionRegulation } from '../../core/regulation';
import { isEnforceable } from '../../core/regulation';

/**
 * REGISTRATION SYSTEM. Every limit is read from CompetitionRegulation — there
 * is not a single hard-coded foreign-player number in this file (brief §8).
 * Changing regulations.data.ts changes behaviour here with no code edit.
 *
 * THREE outcomes, not two:
 *   compliant     - within every enforceable limit
 *   violation     - provably over an enforceable limit
 *   INDETERMINATE - the flat foreign count is over the configured limit, but
 *                   the squad contains ASEAN/Asian players whose category
 *                   quotas are UNKNOWN. Real competitions count those in
 *                   separate buckets, so declaring a violation here would be
 *                   a false alarm. We say "cannot determine" and explain.
 */
export type RegistrationStatus = 'COMPLIANT' | 'VIOLATION' | 'INDETERMINATE';

export interface EligibilityReport {
  status: RegistrationStatus;
  /** Kept for existing callers: true only when status is COMPLIANT. */
  compliant: boolean;
  foreignCount: number;
  foreignLimit: number | null;
  /** Breakdown that makes an INDETERMINATE result explainable. */
  categoryCounts: { thai: number; asean: number; asian: number; other: number; unknown: number };
  /** True when the rule was skipped because the real regulation is unknown. */
  ruleEnforced: boolean;
  violations: string[];
  notes: string[];
}

function countCategories(players: readonly Player[]) {
  const counts = { thai: 0, asean: 0, asian: 0, other: 0, unknown: 0 };
  for (const player of players) counts[player.nationalityCategory] += 1;
  return counts;
}

export function checkRegistration(
  players: readonly Player[],
  regulation: CompetitionRegulation,
): EligibilityReport {
  const rule = regulation.foreignRegistrationMax;
  const foreign = players.filter((p) => p.isForeign).length;
  const enforced = isEnforceable(rule);
  const categoryCounts = countCategories(players);
  const violations: string[] = [];
  const notes: string[] = [];

  let status: RegistrationStatus = 'COMPLIANT';

  if (enforced && rule.value !== null && foreign > rule.value) {
    const categorised = categoryCounts.asean + categoryCounts.asian;
    const generalOnly = categoryCounts.other;
    const categoryQuotasUnknown =
      !isEnforceable(regulation.aseanRegistrationMax) || !isEnforceable(regulation.asianRegistrationMax);

    // Unclassifiable players count too: if the source never named a country
    // we cannot know which bucket they fall in, so the result is unknowable.
    if ((categorised > 0 && categoryQuotasUnknown) || categoryCounts.unknown > 0) {
      // The squad only breaches the flat limit because ASEAN/Asian players
      // are being counted in the same bucket as everyone else. Real rules
      // separate them, and those quotas are not established — so this is
      // unknowable, not a violation.
      status = 'INDETERMINATE';
      const unknownPart =
        categoryCounts.unknown > 0
          ? ` และมี ${categoryCounts.unknown} คนที่เอกสารต้นทางไม่ได้ระบุสัญชาติ`
          : '';
      notes.push(
        `ต่างชาติรวม ${foreign} คน เกินโควตารวม ${rule.value} คน ` +
          `แต่ในจำนวนนี้เป็นอาเซียน ${categoryCounts.asean} คน และเอเชีย ${categoryCounts.asian} คน ` +
          `(ต่างชาติทั่วไป ${generalOnly} คน)${unknownPart} — ` +
          `โควตาแยกหมวดยังไม่ยืนยัน จึงยังสรุปไม่ได้ว่าผิดระเบียบ`,
      );
    } else {
      status = 'VIOLATION';
      violations.push(
        `ผู้เล่นต่างชาติที่ลงทะเบียน ${foreign} คน เกินโควตา ${rule.value} คน`,
      );
    }
  }

  return {
    status,
    compliant: status === 'COMPLIANT',
    foreignCount: foreign,
    foreignLimit: rule.value,
    categoryCounts,
    ruleEnforced: enforced,
    violations,
    notes,
  };
}

export function checkMatchdaySquad(
  players: readonly Player[],
  regulation: CompetitionRegulation,
): EligibilityReport {
  const rule = regulation.foreignMatchdayMax;
  const foreign = players.filter((p) => p.isForeign).length;
  const enforced = isEnforceable(rule);
  const categoryCounts = countCategories(players);
  const violations: string[] = [];

  if (enforced && rule.value !== null && foreign > rule.value) {
    violations.push(
      `ผู้เล่นต่างชาติในวันแข่ง ${foreign} คน เกินโควตา ${rule.value} คน`,
    );
  }

  return {
    status: violations.length === 0 ? 'COMPLIANT' : 'VIOLATION',
    compliant: violations.length === 0,
    foreignCount: foreign,
    foreignLimit: rule.value,
    categoryCounts,
    ruleEnforced: enforced,
    violations,
    notes: [],
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
  // Weakest foreign starters are considered for replacement first.
  const dropOrder = result
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => player.isForeign)
    .sort((a, b) => a.player.ability - b.player.ability);

  for (const { player, index } of dropOrder) {
    if (foreign <= limit) break;
    // Swap LIKE FOR LIKE. Replacing a foreign keeper with an outfielder (or
    // vice versa) would hand the manager an illegal shape — two keepers and
    // ten outfielders — which is how this went wrong before real squads,
    // where keepers were never foreign, exposed it.
    const matchIdx = replacements.findIndex((r) => r.position === player.position);
    if (matchIdx === -1) continue;
    const replacement = replacements.splice(matchIdx, 1)[0] as Player;
    result[index] = replacement;
    foreign -= 1;
  }
  return result;
}
