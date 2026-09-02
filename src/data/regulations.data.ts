import type { CompetitionRegulation } from '../core/regulation';

/**
 * ALL competition rules live here as configuration (brief §8). Changing a
 * value here changes engine behaviour with no code edit — that property is
 * covered by tests/systems/registration.test.ts.
 *
 * Verification status per brief §3:
 *   VERIFIED            - confirmed baseline in the project brief
 *   NEEDS_VERIFICATION  - from a current FA announcement; full regulation
 *                         check still outstanding
 *   UNKNOWN             - not established. The value stays null and the rule
 *                         is NOT enforced. Nothing is invented here.
 */
export const REGULATIONS: Record<string, CompetitionRegulation> = {
  T1: {
    competitionId: 'T1',
    foreignRegistrationMax: { value: 10, verification: 'VERIFIED' },
    foreignMatchdayMax: { value: 7, verification: 'VERIFIED' },
    aseanRegistrationMax: {
      value: null,
      verification: 'UNKNOWN',
      note: 'โควตาอาเซียนยังไม่ยืนยัน — ไม่บังคับใช้จนกว่าจะตรวจระเบียบฉบับเต็ม',
    },
    asianRegistrationMax: {
      value: null,
      verification: 'UNKNOWN',
      note: 'โควตาเอเชียยังไม่ยืนยัน — ไม่บังคับใช้จนกว่าจะตรวจระเบียบฉบับเต็ม',
    },
    promotionSlots: { value: 0, verification: 'VERIFIED', note: 'ลีกสูงสุด' },
    relegationSlots: { value: 3, verification: 'NEEDS_VERIFICATION', note: 'ต้องตรวจระเบียบฉบับเต็ม' },
    pointsForWin: 3,
    pointsForDraw: 1,
  },
  T2: {
    competitionId: 'T2',
    foreignRegistrationMax: {
      value: 4,
      verification: 'NEEDS_VERIFICATION',
      note: 'อ้างอิงประกาศปัจจุบัน ยังไม่ได้ตรวจระเบียบฉบับเต็ม',
    },
    foreignMatchdayMax: {
      value: null,
      verification: 'UNKNOWN',
      note: 'ยังไม่ทราบกฎ matchday ของ T2 — ไม่บังคับใช้จนกว่าจะตรวจสอบ',
    },
    aseanRegistrationMax: {
      value: null,
      verification: 'UNKNOWN',
      note: 'โควตาอาเซียนยังไม่ยืนยัน — ไม่บังคับใช้จนกว่าจะตรวจระเบียบฉบับเต็ม',
    },
    asianRegistrationMax: {
      value: null,
      verification: 'UNKNOWN',
      note: 'โควตาเอเชียยังไม่ยืนยัน — ไม่บังคับใช้จนกว่าจะตรวจระเบียบฉบับเต็ม',
    },
    promotionSlots: { value: 3, verification: 'NEEDS_VERIFICATION' },
    relegationSlots: { value: 3, verification: 'NEEDS_VERIFICATION' },
    pointsForWin: 3,
    pointsForDraw: 1,
  },
  T3: {
    competitionId: 'T3',
    foreignRegistrationMax: {
      value: 3,
      verification: 'NEEDS_VERIFICATION',
      note: 'อ้างอิงประกาศปัจจุบัน ยังไม่ได้ตรวจระเบียบฉบับเต็ม',
    },
    foreignMatchdayMax: {
      value: null,
      verification: 'UNKNOWN',
      note: 'ยังไม่ทราบกฎ matchday ของ T3 — ไม่บังคับใช้จนกว่าจะตรวจสอบ',
    },
    aseanRegistrationMax: {
      value: null,
      verification: 'UNKNOWN',
      note: 'โควตาอาเซียนยังไม่ยืนยัน — ไม่บังคับใช้จนกว่าจะตรวจระเบียบฉบับเต็ม',
    },
    asianRegistrationMax: {
      value: null,
      verification: 'UNKNOWN',
      note: 'โควตาเอเชียยังไม่ยืนยัน — ไม่บังคับใช้จนกว่าจะตรวจระเบียบฉบับเต็ม',
    },
    promotionSlots: {
      value: 3,
      verification: 'VERIFIED',
      note: 'ท็อป 2 ของแต่ละโซน → 12 ทีม → Champions League → เลื่อนชั้น 3 ทีม',
    },
    relegationSlots: { value: 0, verification: 'UNKNOWN' },
    pointsForWin: 3,
    pointsForDraw: 1,
  },
};

export function getRegulation(competitionId: string): CompetitionRegulation {
  const found = REGULATIONS[competitionId];
  if (!found) throw new Error(`No regulation configured for: ${competitionId}`);
  return found;
}
