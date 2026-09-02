import type { SponsorTier } from '../core/sponsor';

/**
 * FICTIONAL sponsor brand names — see core/sponsor.ts for why these are not
 * real companies. Grouped by the tier they can appear as.
 */
export const SPONSOR_NAMES: Record<SponsorTier, string[]> = {
  small: [
    'ร้านทองเจริญพร', 'อู่ซ่อมรถสยามมอเตอร์', 'ก๋วยเตี๋ยวลุงหมู', 'ปั๊มน้ำมันไทยรุ่งเรือง',
    'ร้านค้าวัสดุก่อสร้างบุญมี', 'คลินิกทันตกรรมยิ้มสวย', 'สหกรณ์การเกษตรท้องถิ่น', 'ร้านกาแฟดอยสูง',
  ],
  medium: [
    'ธนไพศาล ประกันภัย', 'สยามโลจิสติกส์', 'ไทยเฟรชมาร์ท', 'เจริญทรัพย์ อสังหาริมทรัพย์',
    'เมืองไทยฟู้ดส์', 'บางกอกแอร์คอนดิชั่นนิ่ง', 'ไทยพัฒนาก่อสร้าง', 'รุ่งเรืองอิเล็กทรอนิกส์',
  ],
  large: [
    'ธนาคารกรุงเมืองไทย', 'ปิยะมหานคร กรุ๊ป', 'ไทยเอเนอร์จี โฮลดิ้ง', 'สยามเทเลคอม',
    'มหานครประกันชีวิต', 'ไทยแอร์ไลน์โฮลดิ้ง', 'เอเชียมอเตอร์สอินดัสทรี', 'กรุงไทยเบฟเวอเรจ',
  ],
};

export const TIER_INCOME_RANGE: Record<SponsorTier, [number, number]> = {
  small: [30_000, 90_000],
  medium: [150_000, 400_000],
  large: [500_000, 1_200_000],
};
