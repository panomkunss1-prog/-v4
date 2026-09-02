import type { ClubId, PlayerId } from '../../core/ids';
import type { Player } from '../../core/player';

/** SQUAD SYSTEM owns squad membership (brief DATA OWNERSHIP). */
export interface Squad {
  clubId: ClubId;
  playerIds: PlayerId[];
}

export function squadPlayers(squad: Squad, allPlayers: readonly Player[]): Player[] {
  const ids = new Set(squad.playerIds);
  return allPlayers.filter((p) => ids.has(p.id));
}

export function foreignCount(players: readonly Player[]): number {
  return players.filter((p) => p.isForeign).length;
}

export function totalWageBill(players: readonly Player[]): number {
  return players.reduce((sum, p) => sum + p.wage, 0);
}

export function averageAbility(players: readonly Player[]): number {
  if (players.length === 0) return 0;
  return players.reduce((sum, p) => sum + p.ability, 0) / players.length;
}
