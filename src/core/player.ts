import type { ClubId, PlayerId } from './ids';
import type { Baht } from './money';

export type Position = 'GK' | 'DF' | 'MF' | 'FW';

/**
 * Static player definition (PlayerDefinition owns this per brief DATA
 * OWNERSHIP). Squad membership lives in the squad system, not here.
 */
export interface Player {
  id: PlayerId;
  clubId: ClubId;
  name: string;
  position: Position;
  /** 1..20 */
  ability: number;
  age: number;
  /** Drives registration limits; nationality strings are fictional-safe. */
  isForeign: boolean;
  nationality: string;
  wage: Baht;
}
