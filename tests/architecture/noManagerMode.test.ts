import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DECISION_HANDLERS } from '../../src/systems/executive/decisions';
import type { DecisionType } from '../../src/core/decision';

/**
 * ============================================================================
 * ARCHITECTURE GUARD — MANAGER MODE DRIFT
 * ============================================================================
 * Brief PLAYER ROLE / §17: the player is the CHAIRMAN. If any code path lets
 * the player pick a Starting XI, formation, tactics, substitutions or in-match
 * actions, that is MANAGER MODE DRIFT and the build must fail.
 *
 * This is the automated version of that stop condition.
 */
const SRC = resolve(__dirname, '../../src');
const UI = join(SRC, 'ui');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*');
    })
    .join('\n');
}

const uiFiles = walk(UI);
const uiCode = uiFiles.map((f) => stripComments(readFileSync(f, 'utf8'))).join('\n');

describe('manager mode drift guard', () => {
  it('has UI files to inspect', () => {
    expect(uiFiles.length).toBeGreaterThan(0);
  });

  it('never imports the NPC team-selection module into the UI layer', () => {
    // selectTeam is the manager's decision. If the UI can call it, the player
    // is one wire away from picking the team.
    expect(uiCode).not.toMatch(/teamSelection/);
    expect(uiCode).not.toMatch(/\bselectTeam\b/);
  });

  it('never imports the match simulation directly into the UI layer', () => {
    expect(uiCode).not.toMatch(/simulateMatch/);
  });

  it('exposes no lineup, formation, tactics or substitution control in the UI', () => {
    const forbidden = [
      /setLineup/i,
      /setFormation/i,
      /setTactic/i,
      /chooseXI/i,
      /startingXI/i,
      /makeSubstitution/i,
      /selectSubstitute/i,
      /pickPlayerFor/i,
    ];
    const hits = forbidden.filter((pattern) => pattern.test(uiCode)).map((p) => p.source);
    expect(hits).toEqual([]);
  });

  it('offers only organisational decision types to the player', () => {
    // Every wired decision must be an ORGANISATIONAL lever, never a match one.
    const matchLevel: DecisionType[] = [];
    const organisational: DecisionType[] = [
      'budget_allocation',
      'academy_investment',
      'facilities_investment',
      'stadium_investment',
      'financial_strategy',
      'board_objective',
      'appoint_manager',
      'dismiss_manager',
      'manager_contract',
      'transfer_approval',
    ];
    for (const type of Object.keys(DECISION_HANDLERS) as DecisionType[]) {
      expect(organisational).toContain(type);
      expect(matchLevel).not.toContain(type);
    }
  });

  it('keeps MatchResult free of any player-editable tactical field', () => {
    const matchSource = readFileSync(join(SRC, 'core/match.ts'), 'utf8');
    expect(stripComments(matchSource)).not.toMatch(/formation|lineup|tactics|substitution/i);
  });
});
