import type { Manager } from '../../core/manager';
import type { Player, Position } from '../../core/player';
import type { CompetitionRegulation } from '../../core/regulation';
import { applyForeignMatchdayCap } from '../registration/eligibility';

/**
 * ============================================================================
 * NPC MANAGER TEAM SELECTION — INTERNAL TO THE MATCH SYSTEM.
 * ============================================================================
 * The NPC manager picks the XI here (brief §6). This module is deliberately
 * NOT exported from the systems barrel and is never reachable from the UI
 * layer: exposing it would hand the player Starting XI control and constitute
 * MANAGER MODE DRIFT (brief §17 / PLAYER ROLE).
 *
 * The chairman influences selection only indirectly — by choosing which
 * manager is employed and how well the club is resourced.
 */
const FORMATION: Record<Position, number> = { GK: 1, DF: 4, MF: 4, FW: 2 };

export interface SelectedTeam {
  starters: Player[];
  /** Ability-weighted team strength used by the simulation. */
  strength: number;
  /** Read-only prose for the chairman. Never an editable control. */
  rationale: string;
}

function pickByPosition(pool: Player[], position: Position, count: number, bias: number): Player[] {
  return pool
    .filter((p) => p.position === position)
    .sort((a, b) => b.ability + bias - (a.ability + bias) || a.id.localeCompare(b.id))
    .slice(0, count);
}

export function selectTeam(
  squad: readonly Player[],
  manager: Manager,
  regulation: CompetitionRegulation,
): SelectedTeam {
  const pool = [...squad];

  // A developmental manager weights youth; others simply pick on ability.
  const bias = manager.philosophy === 'developmental' ? 1 : 0;
  const youthAdjusted = pool.map((p) =>
    bias && p.age <= 23 ? { ...p, ability: Math.min(20, p.ability + 1) } : p,
  );

  let starters: Player[] = [];
  for (const [position, count] of Object.entries(FORMATION)) {
    starters.push(...pickByPosition(youthAdjusted, position as Position, count, 0));
  }

  const startingIds = new Set(starters.map((p) => p.id));
  const bench = youthAdjusted.filter((p) => !startingIds.has(p.id));

  // Matchday foreign quota is enforced by the registration system, not here.
  starters = applyForeignMatchdayCap(starters, bench, regulation);

  const baseStrength =
    starters.reduce((sum, p) => sum + p.ability, 0) / Math.max(1, starters.length);

  // Manager ability and identity shift effective strength.
  const identityModifier =
    manager.tacticalIdentity === 'high_press'
      ? 0.4
      : manager.tacticalIdentity === 'possession'
        ? 0.3
        : manager.tacticalIdentity === 'counter_attack'
          ? 0.2
          : 0;

  const strength =
    baseStrength + manager.ability * 0.18 + identityModifier + manager.squadRelationship * 0.01;

  const rationale = buildRationale(manager, starters);
  return { starters, strength, rationale };
}

function buildRationale(manager: Manager, starters: readonly Player[]): string {
  const foreign = starters.filter((p) => p.isForeign).length;
  const avgAge = Math.round(starters.reduce((s, p) => s + p.age, 0) / Math.max(1, starters.length));
  const style: Record<string, string> = {
    high_press: 'สั่งเพรสซิ่งสูงตั้งแต่ต้นเกม',
    possession: 'เน้นครองบอลและคุมจังหวะ',
    counter_attack: 'ตั้งรับแล้วสวนกลับเร็ว',
    low_block: 'ตั้งบล็อกต่ำและรอจังหวะ',
  };
  const philosophy: Record<string, string> = {
    attacking: 'จัดชุดบุก',
    balanced: 'จัดชุดสมดุล',
    defensive: 'จัดชุดเน้นเกมรับ',
    developmental: 'ดันดาวรุ่งลงสนาม',
  };
  return `${manager.name} ${philosophy[manager.philosophy]} ${style[manager.tacticalIdentity]} · อายุเฉลี่ย ${avgAge} ปี · ต่างชาติ ${foreign} คน`;
}
