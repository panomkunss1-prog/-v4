import type { Club } from '../../core/club';
import type { Baht } from '../../core/money';
import type { Player } from '../../core/player';
import type { Rng } from '../../core/rng';
import { TRAINING_FACILITY_MAX, TRAINING_FACILITY_MIN } from '../../core/club';
import { clamp } from '../../core/result';

/**
 * FACILITIES SYSTEM — training ground. Distinct from the academy (which
 * grows the youth pipeline): this raises the quality of first-team training
 * infrastructure, which in turn improves existing players' development.
 */
const BAHT_PER_LEVEL = 12_000_000;

export function upgradeTrainingFacility(club: Club, investment: Baht): Club {
  const levelsBought = Math.floor(investment / BAHT_PER_LEVEL);
  const level = clamp(
    club.trainingFacilityLevel + levelsBought,
    TRAINING_FACILITY_MIN,
    TRAINING_FACILITY_MAX,
  );
  return { ...club, trainingFacilityLevel: level };
}

/**
 * Applies one matchday of training. Higher facility levels raise both the
 * chance a young player (<=23) improves and, occasionally, a senior player's
 * ceiling. Uses the injected seeded RNG only — never Math.random.
 */
export function applyTraining(players: readonly Player[], trainingFacilityLevel: number, rng: Rng): Player[] {
  const youthChance = 0.015 * trainingFacilityLevel;
  const seniorChance = 0.004 * trainingFacilityLevel;
  return players.map((player) => {
    const chance = player.age <= 23 ? youthChance : seniorChance;
    if (player.ability >= 20 || !rng.chance(chance)) return player;
    return { ...player, ability: player.ability + 1 };
  });
}
