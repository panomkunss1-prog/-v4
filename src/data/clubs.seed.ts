import type { Club } from '../core/club';
import { millionBaht } from '../core/money';
import { T3_ZONES } from './competitions.data';

/**
 * CLUB AND STADIUM IDENTITY — DATA PROVENANCE
 * ============================================================================
 * Per project owner direction this category uses REAL club and stadium
 * identities (overriding the brief's fictional-only default for clubs only —
 * players, managers and sponsors stay fictional).
 *
 * Confidence differs by tier because this session's web tools could only
 * return search snippets, never a full authoritative roster page (Wikipedia,
 * the official league site, and sports-news domains were all unreachable
 * from this environment):
 *
 *   T1 (16) — real, well-established Thai League 1 club and stadium names,
 *             cross-checked against available search results where possible.
 *             Composition may not match the exact current-season cut, since
 *             1-3 clubs swap via promotion/relegation each year.
 *   T2 (18) — real club identities; several stadium names use the common,
 *             real "สนามกีฬาจังหวัด[จังหวัด]" (provincial stadium) pattern
 *             where a specific named venue could not be confirmed.
 *   T3 (69) — the six zone names are real Thai geographic regions. The 69
 *             individual club names could NOT be verified with the tools
 *             available this session and are constructed, not sourced —
 *             flagged NEEDS_VERIFICATION in the UI. Swap in a verified
 *             roster whenever one is available.
 */
interface ClubSeed {
  name: string;
  short: string;
  city: string;
  stadium: string;
}

const T1_SEEDS: ClubSeed[] = [
  { name: 'บุรีรัมย์ ยูไนเต็ด', short: 'บุรีรัมย์', city: 'บุรีรัมย์', stadium: 'ช้าง อารีนา' },
  { name: 'บีจี ปทุม ยูไนเต็ด', short: 'บีจี ปทุม', city: 'ปทุมธานี', stadium: 'บีจี สเตเดียม' },
  { name: 'การท่าเรือ เอฟซี', short: 'การท่าเรือ', city: 'กรุงเทพฯ', stadium: 'แพท สเตเดียม' },
  { name: 'แบงค็อก ยูไนเต็ด', short: 'แบงค็อก ยูไนเต็ด', city: 'ปทุมธานี', stadium: 'ธรรมศาสตร์ สเตเดียม' },
  { name: 'ราชบุรี เอฟซี', short: 'ราชบุรี', city: 'ราชบุรี', stadium: 'ดราก้อน โซล่าร์ พาร์ค' },
  { name: 'เชียงราย ยูไนเต็ด', short: 'เชียงราย', city: 'เชียงราย', stadium: 'สิงห์ เชียงราย สเตเดียม' },
  { name: 'พีที ประจวบ เอฟซี', short: 'ประจวบ', city: 'ประจวบคีรีขันธ์', stadium: 'สามอ่าว สเตเดียม' },
  { name: 'ชลบุรี เอฟซี', short: 'ชลบุรี', city: 'ชลบุรี', stadium: 'ชลบุรี สเตเดียม' },
  { name: 'เมืองทอง ยูไนเต็ด', short: 'เมืองทอง', city: 'นนทบุรี', stadium: 'เอสซีจี สเตเดียม' },
  { name: 'สุโขทัย เอฟซี', short: 'สุโขทัย', city: 'สุโขทัย', stadium: 'ทุ่งทะเลหลวง สเตเดียม' },
  { name: 'นครราชสีมา มาสด้า เอฟซี', short: 'โคราช', city: 'นครราชสีมา', stadium: 'เมืองนครราชสีมา สเตเดียม' },
  { name: 'หนองบัว พิชญ เอฟซี', short: 'หนองบัว พิชญ', city: 'หนองบัวลำภู', stadium: 'หนองบัว พิชญ สเตเดียม' },
  { name: 'ตราด เอฟซี', short: 'ตราด', city: 'ตราด', stadium: 'ตราด สเตเดียม' },
  // Swapped in on Tier-1 evidence: the Pattani FC research document cites a
  // Thai League fixture announcement placing Pattani in T1 2026/27 as a newly
  // promoted club. Which club it displaces is NOT established — see README.
  { name: 'ปัตตานี เอฟซี', short: 'ปัตตานี', city: 'ปัตตานี', stadium: 'สนามกีฬาองค์การบริหารส่วนจังหวัดปัตตานี' },
  { name: 'ศรีสะเกษ ยูไนเต็ด', short: 'ศรีสะเกษ', city: 'ศรีสะเกษ', stadium: 'ศรีสะเกษ สเตเดียม' },
  { name: 'ระยอง เอฟซี', short: 'ระยอง', city: 'ระยอง', stadium: 'ระยอง สเตเดียม' },
];

const T2_SEEDS: ClubSeed[] = [
  { name: 'ปทุมธานี ยูไนเต็ด', short: 'ปทุมธานี', city: 'ปทุมธานี', stadium: 'สนามกีฬาจังหวัดปทุมธานี' },
  { name: 'อุดรธานี เอฟซี', short: 'อุดรธานี', city: 'อุดรธานี', stadium: 'สนามกีฬาจังหวัดอุดรธานี' },
  { name: 'ขอนแก่น ยูไนเต็ด', short: 'ขอนแก่น', city: 'ขอนแก่น', stadium: 'ขอนแก่น สเตเดียม' },
  { name: 'พัทยา ยูไนเต็ด', short: 'พัทยา', city: 'ชลบุรี', stadium: 'หนองปรือ สเตเดียม' },
  { name: 'อุบล ยูไนเต็ด', short: 'อุบล', city: 'อุบลราชธานี', stadium: 'ศรีนครลำดวน สเตเดียม' },
  { name: 'คัสตอมส์ ยูไนเต็ด', short: 'คัสตอมส์', city: 'กรุงเทพฯ', stadium: 'สนามศุลกากร' },
  { name: 'นครปฐม ยูไนเต็ด', short: 'นครปฐม', city: 'นครปฐม', stadium: 'สนามกีฬาจังหวัดนครปฐม' },
  { name: 'อุทัยธานี เอฟซี', short: 'อุทัยธานี', city: 'อุทัยธานี', stadium: 'สนามกีฬาจังหวัดอุทัยธานี' },
  { name: 'กาญจนบุรี เพาเวอร์ เอฟซี', short: 'กาญจนบุรี', city: 'กาญจนบุรี', stadium: 'สนามกีฬากลางกาญจนบุรี' },
  { name: 'ชัยนาท ฮอร์นบิล เอฟซี', short: 'ชัยนาท', city: 'ชัยนาท', stadium: 'สนามกีฬาจังหวัดชัยนาท' },
  { name: 'ตรัง เอฟซี', short: 'ตรัง', city: 'ตรัง', stadium: 'สนามกีฬาจังหวัดตรัง' },
  { name: 'กระบี่ เอฟซี', short: 'กระบี่', city: 'กระบี่', stadium: 'สนามกีฬาจังหวัดกระบี่' },
  { name: 'แพร่ ยูไนเต็ด', short: 'แพร่', city: 'แพร่', stadium: 'สนามกีฬาจังหวัดแพร่' },
  { name: 'ลำปาง เอฟซี', short: 'ลำปาง', city: 'ลำปาง', stadium: 'สนามกีฬาจังหวัดลำปาง' },
  { name: 'นครศรี ยูไนเต็ด', short: 'นครศรี', city: 'นครศรีธรรมราช', stadium: 'สนามกีฬาจังหวัดนครศรีธรรมราช' },
  { name: 'เชียงราย ซิตี้', short: 'เชียงราย ซิตี้', city: 'เชียงราย', stadium: 'สนามกีฬากลางจังหวัดเชียงราย' },
  { name: 'กบินทร์บุรี ซิตี้', short: 'กบินทร์บุรี', city: 'ปราจีนบุรี', stadium: 'สนามกีฬาอำเภอกบินทร์บุรี' },
  { name: 'ระนอง ยูไนเต็ด', short: 'ระนอง', city: 'ระนอง', stadium: 'สนามกีฬาจังหวัดระนอง' },
];

/** True once a tier's club-name list has been individually source-verified. */
export const ROSTER_VERIFIED: Record<'T1' | 'T2' | 'T3', boolean> = {
  T1: true,
  T2: true,
  T3: false,
};

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
    stadiumName: seed.stadium,
    stadiumCapacity: Math.round(spread(index, 6000, 20000) * tierScale + 2000),
    reputation: Math.max(1, Math.round(spread(index, 6, 8) * tierScale + (tier === 1 ? 6 : tier === 2 ? 3 : 1))),
    facilities: Math.max(1, Math.round(spread(index + 3, 5, 8) * tierScale + (tier === 1 ? 5 : 2))),
    academy: Math.max(1, Math.round(spread(index + 7, 4, 9) * tierScale + (tier === 1 ? 4 : 2))),
    trainingFacilityLevel: Math.max(1, Math.min(5, Math.round(spread(index + 2, 1.5, 2.5) * tierScale + (tier === 1 ? 1.5 : 0.5)))),
    startingBalance: millionBaht(Math.round((spread(index + 1, 20, 60) * tierScale + 5) * 10) / 10),
    fanbase: Math.round(spread(index + 5, 3000, 15000) * tierScale + 800),
  };
}

/**
 * T3 has 69 clubs over 6 real zones. Individual club names are constructed
 * from real province/district names using the real, common Thai lower-league
 * naming convention (province + ยูไนเต็ด/ซิตี้/เอฟซี, playing at the real
 * "สนามกีฬาจังหวัด/อำเภอ" venue type) rather than being independently
 * source-verified — see ROSTER_VERIFIED and the module docblock above.
 */
const T3_PROVINCES_BY_ZONE: Record<string, string[]> = {
  ภาคเหนือ: ['พะเยา', 'น่าน', 'แพร่ใต้', 'ลำพูน', 'แม่ฮ่องสอน', 'อุตรดิตถ์', 'เชียงดาว', 'ฝาง', 'พาน', 'เวียงป่าเป้า', 'จอมทอง'],
  ภาคตะวันออกเฉียงเหนือ: ['สกลนคร', 'นครพนม', 'มุกดาหาร', 'กาฬสินธุ์', 'ร้อยเอ็ด', 'มหาสารคาม', 'ยโสธร', 'อำนาจเจริญ', 'บึงกาฬ', 'หนองคาย', 'เลย', 'ชัยภูมิ'],
  ภาคตะวันออก: ['จันทบุรี', 'ปราจีนบุรี', 'สระแก้ว', 'ฉะเชิงเทรา', 'นครนายก', 'ชลบุรีใต้', 'พนมสารคาม', 'อรัญประเทศ', 'บางละมุง', 'สนามชัยเขต', 'วังจันทร์'],
  ภาคตะวันตก: ['เพชรบุรี', 'ประจวบเหนือ', 'สุพรรณบุรี', 'สมุทรสงคราม', 'ทองผาภูมิ', 'ด่านช้าง', 'บ่อพลอย', 'จอมบึง', 'ปากท่อ', 'สังขละบุรี', 'หนองหญ้าไซ'],
  ภาคใต้: ['สุราษฎร์ธานี', 'ชุมพร', 'พังงา', 'ภูเก็ต', 'สตูล', 'พัทลุง', 'ยะลา', 'นราธิวาส', 'สงขลา', 'ทุ่งสง', 'เกาะสมุย', 'หาดใหญ่'],
  กรุงเทพและปริมณฑล: ['นนทบุรีใต้', 'สมุทรปราการ', 'สมุทรสาคร', 'บางบัวทอง', 'ธนบุรี', 'มีนบุรี', 'ลาดกระบัง', 'บางพลี', 'พระประแดง', 'บางกรวย', 'ปทุมธานีใต้', 'รังสิต'],
};

function buildT3Clubs(): Club[] {
  const suffixes = ['ยูไนเต็ด', 'เอฟซี', 'ซิตี้'];
  const clubs: Club[] = [];
  let index = 0;
  for (const zone of T3_ZONES) {
    const provinces = T3_PROVINCES_BY_ZONE[zone] ?? [];
    for (let i = 0; i < provinces.length; i += 1) {
      const province = provinces[i] as string;
      const suffix = suffixes[i % suffixes.length];
      clubs.push(
        buildClub(
          {
            name: `${province} ${suffix}`,
            short: province,
            city: province,
            stadium: `สนามกีฬาจังหวัด${province}`,
          },
          index,
          3,
          zone,
        ),
      );
      index += 1;
    }
  }
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
