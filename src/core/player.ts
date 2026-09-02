import type { ClubId, PlayerId } from './ids';
import type { Baht } from './money';

export type Position = 'GK' | 'DF' | 'MF' | 'FW';

/**
 * Confederation grouping of a player's listed nationality.
 *
 * This records a GEOGRAPHIC fact (is the listed country in ASEAN / the AFC),
 * not a league ruling. Whether a competition actually counts a player in a
 * given quota bucket is a REGULATION question and lives in core/regulation.ts,
 * where it is currently UNKNOWN and therefore unenforced.
 */
export type NationalityCategory = 'thai' | 'asean' | 'asian' | 'other' | 'unknown';

/**
 * How a player's identity got into the game.
 *
 * RESEARCHED  - name/number/position/nationality come from a sourced research
 *               document the project owner explicitly approved for import.
 * CONFLICTED  - sourced, but the research document flagged the entry as
 *               needing further checking before it is trusted.
 * FICTIONAL   - invented for the prototype; makes no claim about any real person.
 */
export type PlayerVerification = 'RESEARCHED' | 'CONFLICTED' | 'FICTIONAL';

/**
 * Static player definition (PlayerDefinition owns this per brief DATA
 * OWNERSHIP). Squad membership lives in the squad system, not here.
 *
 * IMPORTANT — for RESEARCHED players, `ability`, `age` and `wage` are
 * SIMULATED GAME VALUES generated from the seeded RNG. They are not
 * researched facts and must never be presented as claims about the real
 * person. `attributesSimulated` marks this, and the UI surfaces it.
 */
export interface Player {
  id: PlayerId;
  clubId: ClubId;
  name: string;
  /** Shirt number where a source provided one. */
  squadNumber?: number;
  position: Position;
  /** 1..20 — SIMULATED for researched players, see note above. */
  ability: number;
  /** SIMULATED for researched players; real DOB is never guessed. */
  age: number;
  /** Drives the single-bucket registration limit. */
  isForeign: boolean;
  /** Nationality exactly as the source listed it (dual entries preserved). */
  nationality: string;
  nationalityCategory: NationalityCategory;
  /** SIMULATED for researched players. */
  wage: Baht;
  verification: PlayerVerification;
  /** True when ability/age/wage are game values rather than sourced facts. */
  attributesSimulated: boolean;
  /** Provenance for researched entries, e.g. the club's official Team page. */
  source?: string;
}
