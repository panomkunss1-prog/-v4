# -v4

This repository now holds two independent things.

| Path | What it is |
|---|---|
| `legacy/debt-tracker/index.html` | The original single-file Thai debt tracker (`ตารางหนี้`). Preserved unmodified. |
| everything else | **Thai Football Executive** — a web prototype where the player is a club **chairman**, not a manager. |

---

## Thai Football Executive — Prototype

A playable prototype of a Thai football *organisation* management game. The
player runs the club as its **Chairman**: budgets, investment, objectives and
staff. The manager is an **NPC** who selects the team and tactics inside the
simulation. The player never picks a Starting XI, formation, tactics or
substitutions — that boundary is enforced by tests, not just convention.

### Commands

```bash
npm install
npm run dev        # dev server on :5173
npm run build      # typecheck + production build
npm test           # 95 unit / integration / architecture tests
npm run preview    # serve the production build on :4173
node e2e/runtime-verification.mjs   # drive the real app in Chromium (preview must be running)
```

### Architecture

Layers run in one direction only: **Core → Data → Systems → App → UI**.

```
src/core/      pure TypeScript entities and rules. No DOM, no React, no I/O.
               Written to port cleanly to Unity/C# later.
src/data/      static definitions and fictional seed data. Competition
               regulations live here as CONFIGURATION, never hard-coded.
src/systems/   authoritative state owners: league, match, squad,
               registration, finance, board, executive.
src/app/       orchestration, use cases, save/load, read-models for the UI.
src/ui/        React presentation only. Computes no business rules.
```

**Who owns what** — league owns competition state and standings; match owns
simulation; squad owns membership; app owns the session; UI owns nothing but
pixels. Standings are *derived* from results on every read and never persisted,
so a save file can never disagree with the table.

All randomness flows through one seeded PRNG (`core/rng.ts`) injected per
career, so any run is reproducible from its seed.

#### Enforced by tests

`tests/architecture/` fails the build if any of these is violated:

- an import runs against the layer direction (e.g. UI importing `systems/`)
- `core/`, `data/` or `systems/` reference the DOM, React or `localStorage`
- anything outside `ui/` calls `Math.random()`
- the UI can reach team selection, match simulation, or any lineup /
  formation / tactics / substitution control (**Manager Mode drift guard**)

### Competition regulations

Rules are configuration in `src/data/regulations.data.ts`, each tagged with a
verification status:

| Rule | Value | Status |
|---|---|---|
| T1 foreign registration | 10 | VERIFIED |
| T1 foreign matchday | 7 | VERIFIED |
| T2 foreign registration | 4 | NEEDS_VERIFICATION |
| T3 foreign registration | 3 | NEEDS_VERIFICATION |
| T2 / T3 foreign **matchday** | `null` | **UNKNOWN — not enforced** |

Where the real regulation is unknown the value stays `null` and the check is
skipped. **No number is invented.** Changing a value in that file changes
engine behaviour with no code edit — covered by a test.

### Data

All clubs, players and managers are **fictional**, generated at career
creation. No real player or club data is imported. Research Verified ≠
Approved for Import.

### Current scope — Slice 1

Implemented end-to-end: new career → chairman creation → club selection →
dashboard → executive decision → state change → advance matchday → match
result → league table update → consequence display. Thai League 1 (16 clubs),
one season, 30 matchdays.

**Not yet implemented:** season end, promotion/relegation, T2/T3 simulation,
and eight of the ten executive decision types. Unwired decision types are
rejected explicitly rather than silently ignored.
