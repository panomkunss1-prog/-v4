import type {
  ChairmanAttributeKey,
  ChairmanBackground,
  ChairmanGoal,
  ChairmanPersonality,
} from '../core/chairman';

/** Thai display labels. Presentation strings live in data, not in UI logic. */
export const BACKGROUND_LABEL: Record<ChairmanBackground, string> = {
  businessperson: 'นักธุรกิจ',
  former_footballer: 'อดีตนักฟุตบอล',
  corporate_executive: 'ผู้บริหารองค์กร',
  supporter_founder: 'แฟนบอลผู้ก่อตั้ง',
  business_heir: 'ทายาทธุรกิจ',
};

export const PERSONALITY_LABEL: Record<ChairmanPersonality, string> = {
  ambitious: 'ทะเยอทะยาน',
  patient: 'ใจเย็น',
  risk_taker: 'กล้าเสี่ยง',
  financial_conservative: 'อนุรักษ์นิยมทางการเงิน',
};

export const GOAL_LABEL: Record<ChairmanGoal, string> = {
  promotion: 'เลื่อนชั้น',
  build_academy: 'สร้างอะคาเดมี',
  turn_profit: 'ทำกำไร',
  win_title: 'คว้าแชมป์',
};

export const ATTRIBUTE_LABEL: Record<ChairmanAttributeKey, string> = {
  leadership: 'ภาวะผู้นำ',
  footballKnowledge: 'ความรู้ฟุตบอล',
  business: 'ธุรกิจ',
  finance: 'การเงิน',
  negotiation: 'การเจรจา',
  networking: 'คอนเนคชัน',
  reputation: 'ชื่อเสียง',
  strategicVision: 'วิสัยทัศน์',
};

export const BACKGROUNDS = Object.keys(BACKGROUND_LABEL) as ChairmanBackground[];
export const PERSONALITIES = Object.keys(PERSONALITY_LABEL) as ChairmanPersonality[];
export const GOALS = Object.keys(GOAL_LABEL) as ChairmanGoal[];
