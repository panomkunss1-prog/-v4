import type { ClubId, ManagerId } from './ids';
import type { Baht } from './money';

/**
 * Manager is an NPC/Staff entity (brief §6). The manager — never the player —
 * selects the XI and tactical identity inside the simulation. There is
 * deliberately no API on this type that lets the UI set a lineup.
 */
export type ManagerPhilosophy = 'attacking' | 'balanced' | 'defensive' | 'developmental';
export type TacticalIdentity = 'high_press' | 'possession' | 'counter_attack' | 'low_block';

export interface Manager {
  id: ManagerId;
  name: string;
  clubId: ClubId | null;
  /** 1..20 */
  ability: number;
  reputation: number;
  experience: number;
  philosophy: ManagerPhilosophy;
  tacticalIdentity: TacticalIdentity;
  salary: Baht;
  /** 0..100 rolling ratings updated by results and by chairman decisions. */
  performance: number;
  boardRelationship: number;
  squadRelationship: number;
}
