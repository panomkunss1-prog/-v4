import type { Club } from '../core/club';
import { millionBaht } from '../core/money';
import { T3_ZONES } from './competitions.data';

/**
 * FICTIONAL CLUBS ONLY.
 *
 * Brief §12: "Research Verified ≠ Approved for Import". No real Thai club
 * enters runtime. Every name below is invented for the prototype; any
 * resemblance to a real club is unintended and should be reported.
 */
interface ClubSeed {
  name: string;
  short: string;
  city: string;
}

const T1_SEEDS: ClubSeed[] = [
  { name: 'สโมสรนครสุพรรณ ยูไนเต็ด', short: 'นครสุพรรณ', city: 'นครสุพรรณ' },
  { name: 'สโมสรบูรพาวารี เอฟซี', short: 'บูรพาวารี', city: 'บูรพาวารี' },
  { name: 'สโมสรดอยหลวง วอริเออร์ส', short: 'ดอยหลวง', city: 'ดอยหลวง' },
  { name: 'สโมสรอ่าวทองคำ ซิตี้', short: 'อ่าวทองคำ', city: 'อ่าวทองคำ' },
  { name: 'สโมสรพระธาตุทอง เอฟซี', short: 'พระธาตุทอง', city: 'พระธาตุทอง' },
  { name: 'สโมสรเมืองใหม่ ไดนาโม', short: 'เมืองใหม่', city: 'เมืองใหม่' },
  { name: 'สโมสรลุ่มน้ำเจ็ดสาย', short: 'ลุ่มน้ำ', city: 'ลุ่มน้ำ' },
  { name: 'สโมสรศรีอโยธร ยูไนเต็ด', short: 'ศรีอโยธร', city: 'ศรีอโยธร' },
  { name: 'สโมสรหาดเงิน เอฟซี', short: 'หาดเงิน', city: 'หาดเงิน' },
  { name: 'สโมสรป่าสนคีรี', short: 'ป่าสนคีรี', city: 'ป่าสนคีรี' },
  { name: 'สโมสรวิหารขาว เอฟซี', short: 'วิหารขาว', city: 'วิหารขาว' },
  { name: 'สโมสรตะวันรุ่ง ซิตี้', short: 'ตะวันรุ่ง', city: 'ตะวันรุ่ง' },
  { name: 'สโมสรบางกล้วยนอก เอฟซี', short: 'บางกล้วยนอก', city: 'บางกล้วยนอก' },
  { name: 'สโมสรผาแดง ยูไนเต็ด', short: 'ผาแดง', city: 'ผาแดง' },
  { name: 'สโมสรคลองสามพราน', short: 'คลองสามพราน', city: 'คลองสามพราน' },
  { name: 'สโมสรเกาะมรกต เอฟซี', short: 'เกาะมรกต', city: 'เกาะมรกต' },
];

const T2_SEEDS: ClubSeed[] = [
  { name: 'สโมสรทุ่งทานตะวัน เอฟซี', short: 'ทุ่งทานตะวัน', city: 'ทุ่งทานตะวัน' },
  { name: 'สโมสรน้ำตกเจ็ดชั้น', short: 'น้ำตกเจ็ดชั้น', city: 'น้ำตกเจ็ดชั้น' },
  { name: 'สโมสรเวียงพิงค์ทอง', short: 'เวียงพิงค์ทอง', city: 'เวียงพิงค์ทอง' },
  { name: 'สโมสรสะพานหิน ยูไนเต็ด', short: 'สะพานหิน', city: 'สะพานหิน' },
  { name: 'สโมสรบ้านโป่งใหญ่ เอฟซี', short: 'บ้านโป่งใหญ่', city: 'บ้านโป่งใหญ่' },
  { name: 'สโมสรราชสีห์เหนือ', short: 'ราชสีห์เหนือ', city: 'ราชสีห์เหนือ' },
  { name: 'สโมสรอินทรีทะเล เอฟซี', short: 'อินทรีทะเล', city: 'อินทรีทะเล' },
  { name: 'สโมสรหนองบัวขาว', short: 'หนองบัวขาว', city: 'หนองบัวขาว' },
  { name: 'สโมสรเขาสามยอด ซิตี้', short: 'เขาสามยอด', city: 'เขาสามยอด' },
  { name: 'สโมสรท่าเรือทอง เอฟซี', short: 'ท่าเรือทอง', city: 'ท่าเรือทอง' },
  { name: 'สโมสรไร่ส้มโอ ยูไนเต็ด', short: 'ไร่ส้มโอ', city: 'ไร่ส้มโอ' },
  { name: 'สโมสรลำธารใส', short: 'ลำธารใส', city: 'ลำธารใส' },
  { name: 'สโมสรป้อมปราการ เอฟซี', short: 'ป้อมปราการ', city: 'ป้อมปราการ' },
  { name: 'สโมสรสวนยางหลวง', short: 'สวนยางหลวง', city: 'สวนยางหลวง' },
  { name: 'สโมสรดินแดงเก่า ซิตี้', short: 'ดินแดงเก่า', city: 'ดินแดงเก่า' },
  { name: 'สโมสรภูผาม่าน เอฟซี', short: 'ภูผาม่าน', city: 'ภูผาม่าน' },
  { name: 'สโมสรคลองด่านใต้', short: 'คลองด่านใต้', city: 'คลองด่านใต้' },
  { name: 'สโมสรมณีบูรพา ยูไนเต็ด', short: 'มณีบูรพา', city: 'มณีบูรพา' },
];

/** Deterministic pseudo-variance so seeded clubs are not all identical. */
function spread(index: number, base: number, range: number): number {
  const wave = Math.sin(index * 2.399963) * 0.5 + 0.5;
  return Math.round(base + wave * range);
}

function buildClub(seed: ClubSeed, index: number, tier: 1 | 2 | 3, zone?: string): Club {
  const tierScale = tier === 1 ? 1 : tier === 2 ? 0.55 : 0.25;
  return {
    id: `${tier === 1 ? 'T1' : tier === 2 ? 'T2' : 'T3'}-${String(index + 1).padStart(2, '0')}`,
    name: seed.name,
    shortName: seed.short,
    city: seed.city,
    tier,
    ...(zone ? { zone } : {}),
    stadiumCapacity: Math.round(spread(index, 6000, 20000) * tierScale + 2000),
    reputation: Math.max(1, Math.round(spread(index, 6, 8) * tierScale + (tier === 1 ? 6 : tier === 2 ? 3 : 1))),
    facilities: Math.max(1, Math.round(spread(index + 3, 5, 8) * tierScale + (tier === 1 ? 5 : 2))),
    academy: Math.max(1, Math.round(spread(index + 7, 4, 9) * tierScale + (tier === 1 ? 4 : 2))),
    startingBalance: millionBaht(Math.round((spread(index + 1, 20, 60) * tierScale + 5) * 10) / 10),
    fanbase: Math.round(spread(index + 5, 3000, 15000) * tierScale + 800),
  };
}

/** T3 has 69 clubs over 6 zones; generated so the structure is real without 69 hand-written names. */
function buildT3Clubs(): Club[] {
  const suffixes = ['ยูไนเต็ด', 'เอฟซี', 'ซิตี้', 'วอริเออร์ส', 'แอธเลติก'];
  const clubs: Club[] = [];
  const perZone = [12, 12, 11, 11, 11, 12]; // sums to 69
  let index = 0;
  T3_ZONES.forEach((zone, zoneIndex) => {
    const count = perZone[zoneIndex] ?? 11;
    for (let i = 0; i < count; i += 1) {
      const suffix = suffixes[(index + i) % suffixes.length];
      clubs.push(
        buildClub(
          {
            name: `สโมสรท้องถิ่น ${zone} ${i + 1} ${suffix}`,
            short: `${zone.slice(0, 6)} ${i + 1}`,
            city: zone,
          },
          index,
          3,
          zone,
        ),
      );
      index += 1;
    }
  });
  return clubs;
}

export const T1_CLUBS: Club[] = T1_SEEDS.map((s, i) => buildClub(s, i, 1));
export const T2_CLUBS: Club[] = T2_SEEDS.map((s, i) => buildClub(s, i, 2));
export const T3_CLUBS: Club[] = buildT3Clubs();

export const ALL_CLUBS: Club[] = [...T1_CLUBS, ...T2_CLUBS, ...T3_CLUBS];

export function clubsForCompetition(competitionId: string): Club[] {
  if (competitionId === 'T1') return T1_CLUBS;
  if (competitionId === 'T2') return T2_CLUBS;
  if (competitionId === 'T3') return T3_CLUBS;
  throw new Error(`Unknown competition: ${competitionId}`);
}

export function getClub(clubId: string): Club {
  const found = ALL_CLUBS.find((c) => c.id === clubId);
  if (!found) throw new Error(`Unknown club: ${clubId}`);
  return found;
}
