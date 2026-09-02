import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * ============================================================================
 * ARCHITECTURE GUARD — LAYER DEPENDENCY DIRECTION
 * ============================================================================
 * Brief §9 / §19 mandate Core -> Data -> Systems -> App -> UI with UI as
 * presentation only. These tests fail the build if that direction is ever
 * violated, so the rule is enforced by CI rather than by review discipline.
 */
const SRC = resolve(__dirname, '../../src');

type Layer = 'core' | 'data' | 'systems' | 'app' | 'ui';

/** Which layers each layer is permitted to import from. */
const ALLOWED: Record<Layer, Layer[]> = {
  core: ['core'],
  data: ['core', 'data'],
  systems: ['core', 'data', 'systems'],
  app: ['core', 'data', 'systems', 'app'],
  ui: ['core', 'data', 'app', 'ui'], // NOTE: ui may NOT import systems.
};

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

function layerOf(file: string): Layer | null {
  const rel = relative(SRC, file).replace(/\\/g, '/');
  const top = rel.split('/')[0];
  return (['core', 'data', 'systems', 'app', 'ui'] as Layer[]).includes(top as Layer)
    ? (top as Layer)
    : null;
}

/**
 * Strips comments so the guards below scan real code only. Without this a
 * doc-comment that merely *names* a banned API would fail the build.
 */
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

function importsOf(source: string): string[] {
  const specifiers: string[] = [];
  const re = /(?:import|export)[\s\S]*?from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) specifiers.push(match[1] as string);
  return specifiers;
}

/** Resolves a relative specifier back to the layer it lands in. */
function targetLayer(file: string, specifier: string): Layer | null {
  if (!specifier.startsWith('.')) return null;
  const resolved = resolve(file, '..', specifier);
  return layerOf(resolved);
}

const files = walk(SRC);

describe('layer dependency direction', () => {
  it('finds source files to inspect', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('never imports against the Core -> Data -> Systems -> App -> UI direction', () => {
    const violations: string[] = [];
    for (const file of files) {
      const from = layerOf(file);
      if (!from) continue;
      const source = readFileSync(file, 'utf8');
      for (const specifier of importsOf(source)) {
        const to = targetLayer(file, specifier);
        if (!to) continue;
        if (!ALLOWED[from].includes(to)) {
          violations.push(`${relative(SRC, file)} (${from}) -> ${specifier} (${to})`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('keeps core free of any dependency on an outer layer', () => {
    const coreFiles = files.filter((f) => layerOf(f) === 'core');
    expect(coreFiles.length).toBeGreaterThan(5);
    for (const file of coreFiles) {
      for (const specifier of importsOf(readFileSync(file, 'utf8'))) {
        expect(targetLayer(file, specifier) ?? 'core').toBe('core');
      }
    }
  });

  it('forbids the UI from importing the systems layer directly', () => {
    const uiFiles = files.filter((f) => layerOf(f) === 'ui');
    const offenders = uiFiles.filter((file) =>
      importsOf(readFileSync(file, 'utf8')).some((s) => targetLayer(file, s) === 'systems'),
    );
    expect(offenders.map((f) => relative(SRC, f))).toEqual([]);
  });
});

describe('portability to a future Unity/C# port', () => {
  it('keeps core and systems free of DOM, React and browser APIs', () => {
    const banned = [
      /\bdocument\./,
      /\bwindow\./,
      /\blocalStorage\b/,
      /from\s+['"]react/,
      /\.tsx$/,
    ];
    const offenders: string[] = [];
    for (const file of files) {
      const layer = layerOf(file);
      if (layer !== 'core' && layer !== 'systems' && layer !== 'data') continue;
      const source = readFileSync(file, 'utf8');
      for (const pattern of banned) {
        const code = stripComments(source);
        if (pattern.source === '\\.tsx$' ? pattern.test(file) : pattern.test(code)) {
          offenders.push(`${relative(SRC, file)} matches ${pattern}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('routes all randomness through the injected seeded RNG, never Math.random', () => {
    const offenders = files
      .filter((f) => {
        const layer = layerOf(f);
        return layer === 'core' || layer === 'systems' || layer === 'data' || layer === 'app';
      })
      .filter((f) => /Math\.random/.test(stripComments(readFileSync(f, 'utf8'))))
      .map((f) => relative(SRC, f));
    expect(offenders).toEqual([]);
  });
});
