import type { Club } from '../core/club';
import type { Manager, ManagerPhilosophy, TacticalIdentity } from '../core/manager';
import type { Rng } from '../core/rng';
import { baht } from '../core/money';
import { clamp } from '../core/result';

/** FICTIONAL MANAGERS ONLY. */
const MANAGER_NAMES = [
  'สมชาย ธรรมรักษ์', 'วิชัย ปานทอง', 'ประเสริฐ ชูเกียรติ', 'ธงชัย มณีรัตน์',
  'อรรถพล สุขเจริญ', 'บรรจง วงศ์ไพศาล', 'Rui Bettencourt', 'Anders Lindqvist',
  'Choi Min-seo', 'Gerald Vance', 'สุรชัย เดชอุดม', 'พิชิต ราชานนท์',
];

const PHILOSOPHIES: ManagerPhilosophy[] = ['attacking', 'balanced', 'defensive', 'developmental'];
const IDENTITIES: TacticalIdentity[] = ['high_press', 'possession', 'counter_attack', 'low_block'];

export const PHILOSOPHY_LABEL: Record<ManagerPhilosophy, string> = {
  attacking: 'เกมรุก',
  balanced: 'สมดุล',
  defensive: 'เกมรับ',
  developmental: 'ปั้นดาวรุ่ง',
};

export const IDENTITY_LABEL: Record<TacticalIdentity, string> = {
  high_press: 'เพรสซิ่งสูง',
  possession: 'ครองบอล',
  counter_attack: 'สวนกลับ',
  low_block: 'ตั้งรับลึก',
};

export function generateManager(club: Club, rng: Rng): Manager {
  const ability = clamp(Math.round(rng.float(club.reputation * 0.5 + 3, club.reputation * 0.6 + 9)), 1, 20);
  return {
    id: `${club.id}-MGR`,
    name: rng.pick(MANAGER_NAMES),
    clubId: club.id,
    ability,
    reputation: clamp(Math.round(ability * 0.8 + rng.int(-2, 3)), 1, 20),
    experience: rng.int(1, 20),
    philosophy: rng.pick(PHILOSOPHIES),
    tacticalIdentity: rng.pick(IDENTITIES),
    salary: baht(ability * 22000 + rng.int(0, 40000)),
    performance: 50,
    boardRelationship: rng.int(45, 70),
    squadRelationship: rng.int(45, 75),
  };
}
