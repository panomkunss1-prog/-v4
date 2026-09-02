import type { Club } from '../../core/club';
import type { Baht } from '../../core/money';
import { clamp } from '../../core/result';

/**
 * FACILITIES SYSTEM — stadium. Every baht invested buys a fixed amount of
 * extra capacity, with mild diminishing returns as the ground gets larger so
 * a single huge investment can't instantly build a mega-stadium.
 */
const BAHT_PER_SEAT = 3500;
const MAX_CAPACITY = 60000;

export function capacityGainFor(club: Club, investment: Baht): number {
  const raw = Math.floor(investment / BAHT_PER_SEAT);
  const room = Math.max(0, MAX_CAPACITY - club.stadiumCapacity);
  // Returns taper as the stadium approaches the prototype's capacity ceiling.
  const taper = room / MAX_CAPACITY;
  return Math.min(room, Math.round(raw * clamp(taper + 0.15, 0.15, 1)));
}

export function upgradeStadium(club: Club, investment: Baht): Club {
  const gain = capacityGainFor(club, investment);
  return { ...club, stadiumCapacity: club.stadiumCapacity + gain };
}
