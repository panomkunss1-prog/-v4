import type { Club } from '../core/club';
import type { Player, Position } from '../core/player';
import type { Rng } from '../core/rng';
import { baht } from '../core/money';
import { clamp } from '../core/result';
import { researchedSquadFor, type ResearchedPlayer } from './researchedSquads.data';

/**
 * Squad generation has two paths:
 *
 *  1. A club with an approved RESEARCHED squad (see researchedSquads.data.ts)
 *     gets its real names, shirt numbers, positions and nationalities. Its
 *     ability/age/wage are still SIMULATED game values — no fabricated
 *     statistic is ever presented as a fact about a real person.
 *  2. Every other club gets a fully FICTIONAL squad, as before.
 */
const THAI_FIRST = [
  'ธนกฤต', 'ศุภชัย', 'อนุชา', 'วีรภัทร', 'กิตติพงษ์', 'ณัฐวุฒิ', 'พีรพล', 'สหรัฐ',
  'ชยพล', 'ธีรเดช', 'ภาณุพงศ์', 'อัครเดช', 'จิรายุ', 'ปรเมศวร์', 'สิทธิโชค', 'ทรงพล',
  'เอกรัตน์', 'นราวิชญ์', 'ก้องภพ', 'ธนดล',
];
const THAI_LAST = [
  'ใจดี', 'ศรีสุข', 'ทองอยู่', 'แสงจันทร์', 'บุญมี', 'พงษ์ไพร', 'รุ่งเรือง', 'วารีทิพย์',
  'ขจรเดช', 'อินทรพล', 'สุวรรณโชติ', 'ธารทอง', 'ภูผาแก้ว', 'กมลชัย',
];
/** Fictional-safe foreign name pool with invented nationality labels. */
const FOREIGN_NAMES = [
  'Marco Aveline', 'Diego Ferrante', 'Kwame Obeng', 'Luka Petrovic', 'Hiro Tanabe',
  'Andre Baptiste', 'Nikolai Verhoven', 'Samuel Okoro', 'Tomas Kral', 'Yuji Nakura',
  'Pablo Serrano', 'Ivan Mirkovic',
];
const FOREIGN_NATIONS = ['บราซิเลีย', 'กานาเรีย', 'เซอร์เบียนา', 'นิปปอนเนีย', 'ไอบีเรีย'];

/** A 22-man fictional squad: 3 GK, 7 DF, 7 MF, 5 FW. */
const SQUAD_SHAPE: Position[] = [
  'GK', 'GK', 'GK',
  'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF',
  'MF', 'MF', 'MF', 'MF', 'MF', 'MF', 'MF',
  'FW', 'FW', 'FW', 'FW', 'FW',
];

export const SQUAD_SIZE = SQUAD_SHAPE.length;

/**
 * Simulated match-engine attributes. Deliberately the ONLY place a researched
 * player receives numbers, and everything it produces is marked simulated.
 */
function simulateAttributes(club: Club, isForeign: boolean, rng: Rng) {
  const base = 4 + club.reputation * 0.55;
  const ability = clamp(Math.round(rng.float(base - 2, base + 4) + (isForeign ? 1.5 : 0)), 1, 20);
  return {
    ability,
    age: rng.int(18, 34),
    wage: baht(ability * (isForeign ? 9000 : 5000) + rng.int(0, 8000)),
  };
}

function fromResearched(club: Club, entry: ResearchedPlayer, index: number, source: string, rng: Rng): Player {
  const isForeign = entry.nationalityCategory !== 'thai';
  const attributes = simulateAttributes(club, isForeign, rng);
  return {
    id: `${club.id}-P${String(index + 1).padStart(2, '0')}`,
    clubId: club.id,
    name: entry.name,
    squadNumber: entry.squadNumber,
    position: entry.position,
    isForeign,
    nationality: entry.nationality,
    nationalityCategory: entry.nationalityCategory,
    verification: entry.verification,
    attributesSimulated: true,
    source,
    ...attributes,
  };
}

/**
 * Generates a squad whose foreign contingent is capped by the competition's
 * registration limit, so a freshly seeded fictional career starts compliant.
 * Researched squads are imported as-is — their real composition is a fact and
 * is never trimmed to fit a rule the prototype has not verified.
 */
export function generateSquad(club: Club, rng: Rng, foreignRegistrationMax: number): Player[] {
  const researched = researchedSquadFor(club.id);
  if (researched && researched.expectedClubName === club.name) {
    return researched.players.map((entry, i) =>
      fromResearched(club, entry, i, researched.source, rng),
    );
  }

  const targetForeign = Math.min(foreignRegistrationMax, rng.int(2, Math.max(2, foreignRegistrationMax)));
  const foreignSlots = new Set<number>();
  while (foreignSlots.size < targetForeign) {
    // Keepers stay domestic in the prototype to keep selection simple.
    foreignSlots.add(rng.int(3, SQUAD_SIZE - 1));
  }

  return SQUAD_SHAPE.map((position, i) => {
    const isForeign = foreignSlots.has(i);
    const attributes = simulateAttributes(club, isForeign, rng);
    const name = isForeign
      ? rng.pick(FOREIGN_NAMES)
      : `${rng.pick(THAI_FIRST)} ${rng.pick(THAI_LAST)}`;
    return {
      id: `${club.id}-P${String(i + 1).padStart(2, '0')}`,
      clubId: club.id,
      name,
      position,
      isForeign,
      nationality: isForeign ? rng.pick(FOREIGN_NATIONS) : 'ไทย',
      nationalityCategory: isForeign ? ('other' as const) : ('thai' as const),
      verification: 'FICTIONAL' as const,
      attributesSimulated: true,
      ...attributes,
    };
  });
}
