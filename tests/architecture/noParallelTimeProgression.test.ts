import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * ============================================================================
 * ARCHITECTURE GUARD — NO PARALLEL MATCH/LEAGUE PIPELINE FOR TIME PROGRESSION
 * ============================================================================
 * The whole point of app/gameClock.ts is that "NEXT" delegates to the
 * existing advanceMatchday() rather than re-implementing match simulation or
 * league integration. This guard fails the build the moment that stops being
 * true — e.g. if a future edit imports simulateMatch or computeStandings
 * directly into the clock or the calendar systems, which would be exactly
 * the duplicate pipeline the brief forbids.
 */
const GAME_CLOCK = resolve(__dirname, '../../src/app/gameClock.ts');
const CALENDAR_FILES = [
  resolve(__dirname, '../../src/systems/calendar/seasonCalendar.ts'),
  resolve(__dirname, '../../src/systems/calendar/events.ts'),
];

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

describe('time progression never duplicates match/league logic', () => {
  const clockSource = stripComments(readFileSync(GAME_CLOCK, 'utf8'));

  it('gameClock.ts never imports the match simulation directly', () => {
    expect(clockSource).not.toMatch(/simulateMatch/);
  });

  it('gameClock.ts never imports standings computation directly', () => {
    expect(clockSource).not.toMatch(/computeStandings/);
  });

  it('gameClock.ts never constructs a MatchResult object literal', () => {
    // Legitimate uses read MatchResult fields (homeGoals, awayGoals, etc.);
    // constructing one would mean `matchId:` appearing as an object key.
    expect(clockSource).not.toMatch(/matchId\s*:/);
  });

  it('gameClock.ts DOES delegate to the existing advanceMatchday for every tick', () => {
    expect(clockSource).toMatch(/import\s*\{[^}]*advanceMatchday[^}]*\}\s*from\s*['"]\.\/advanceMatchday['"]/);
    expect(clockSource).toMatch(/advanceMatchday\(/);
  });

  it('the calendar systems stay pure content/date generators with no match or league imports', () => {
    for (const file of CALENDAR_FILES) {
      const source = stripComments(readFileSync(file, 'utf8'));
      expect(source).not.toMatch(/simulateMatch|computeStandings|resolvePyramid/);
      expect(source).not.toMatch(/from ['"].*systems\/match/);
      expect(source).not.toMatch(/from ['"].*systems\/league/);
    }
  });

  it('gameClock.ts never mutates League state — it only reads results it did not create', () => {
    // "mutate League directly" would mean writing to state.season/table
    // fields with hand-computed values instead of what advanceMatchday
    // already returned. The only `season:` this file may reference is via
    // reading `state.season.*`, never constructing a season object.
    expect(clockSource).not.toMatch(/season:\s*\{/);
  });
});
