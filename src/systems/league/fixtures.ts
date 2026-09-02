import type { Match } from '../../core/match';
import type { ClubId, SeasonId } from '../../core/ids';
import type { Rng } from '../../core/rng';

/**
 * LEAGUE SYSTEM owns competition state (brief DATA OWNERSHIP).
 * Double round-robin via the circle method: every club meets every other club
 * home and away, so matchdays = (n - 1) * 2 for an even club count.
 */
export function generateFixtures(
  seasonId: SeasonId,
  clubIds: readonly ClubId[],
  rng: Rng,
): Match[] {
  if (clubIds.length < 2) return [];
  const clubs = [...clubIds];
  // Odd counts get a bye placeholder so the rotation still works.
  const bye = '__BYE__';
  if (clubs.length % 2 === 1) clubs.push(bye);

  // Shuffle so fixture order varies per career but stays reproducible.
  for (let i = clubs.length - 1; i > 0; i -= 1) {
    const j = rng.int(0, i);
    const a = clubs[i] as ClubId;
    const b = clubs[j] as ClubId;
    clubs[i] = b;
    clubs[j] = a;
  }

  const n = clubs.length;
  const rounds = n - 1;
  const half = n / 2;
  const matches: Match[] = [];
  const rotation = clubs.slice(1);

  for (let round = 0; round < rounds; round += 1) {
    const dayPairs: Array<[ClubId, ClubId]> = [];
    const first = clubs[0] as ClubId;
    // The fixed club meets rotation[round]; the loop below consumes every
    // other index (round +/- i), so this is the only one left free.
    const opponent = rotation[round % rotation.length] as ClubId;
    dayPairs.push(round % 2 === 0 ? [first, opponent] : [opponent, first]);

    for (let i = 1; i < half; i += 1) {
      const homeIdx = (round + i) % rotation.length;
      const awayIdx = (rotation.length - i + round) % rotation.length;
      const home = rotation[homeIdx] as ClubId;
      const away = rotation[awayIdx] as ClubId;
      dayPairs.push(i % 2 === 0 ? [home, away] : [away, home]);
    }

    for (const [home, away] of dayPairs) {
      if (home === bye || away === bye) continue;
      // First half of the season.
      matches.push({
        id: `${seasonId}-M${matches.length + 1}`,
        seasonId,
        matchday: round + 1,
        homeClubId: home,
        awayClubId: away,
        status: 'scheduled',
      });
    }
  }

  // Reverse fixtures form the second half of the season.
  const firstHalf = [...matches];
  for (const match of firstHalf) {
    matches.push({
      id: `${seasonId}-M${matches.length + 1}`,
      seasonId,
      matchday: match.matchday + rounds,
      homeClubId: match.awayClubId,
      awayClubId: match.homeClubId,
      status: 'scheduled',
    });
  }

  return matches;
}

export function totalMatchdays(clubCount: number): number {
  const n = clubCount % 2 === 1 ? clubCount + 1 : clubCount;
  return (n - 1) * 2;
}

export function matchesForMatchday(matches: readonly Match[], matchday: number): Match[] {
  return matches.filter((m) => m.matchday === matchday);
}
