import type { InboxCategory } from '../../core/inboxItem';

export interface ScheduledEventTemplate {
  category: InboxCategory;
  title: string;
  body: string;
}

/**
 * CALENDAR SYSTEM — scheduled executive events.
 *
 * Deterministic, keyed ONLY by matchday position within the season (never by
 * RNG, never by match results). The same matchday always produces the same
 * events for the same season length, which is what "Calendar must be
 * deterministic" requires and what makes this independently testable.
 *
 * Every event here is organisational/informational — a board note, a
 * sponsor-window reminder, a season milestone. None of it is a tactical
 * decision or a match-control surface (brief PLAYER ROLE). This is content
 * generation, not a new decision system: it produces read-only inbox text
 * that points at screens the chairman already has (sponsors, decisions).
 */
export function scheduledEventsForMatchday(
  matchday: number,
  totalMatchdays: number,
): ScheduledEventTemplate[] {
  const events: ScheduledEventTemplate[] = [];

  if (matchday === 1) {
    events.push({
      category: 'season',
      title: 'เปิดฤดูกาล',
      body: 'ฤดูกาลใหม่เริ่มต้นแล้ว ติดตามผลการแข่งขันและการตัดสินใจของคุณได้ที่นี่ทุกครั้งที่กด "ถัดไป"',
    });
  }

  if (totalMatchdays >= 4) {
    const quarter = Math.round(totalMatchdays / 4);
    const half = Math.round(totalMatchdays / 2);
    const threeQuarter = Math.round((totalMatchdays * 3) / 4);

    if (matchday === quarter && quarter > 1) {
      events.push({
        category: 'board',
        title: 'บอร์ดเริ่มติดตามผลงาน',
        body: 'ผ่านไปหนึ่งในสี่ของฤดูกาลแล้ว บอร์ดเริ่มจับตาดูผลงานทีมเทียบกับเป้าหมายที่ตั้งไว้ตอนต้นฤดูกาล',
      });
    }
    if (matchday === half && half > quarter) {
      events.push({
        category: 'sponsor',
        title: 'ช่วงกลางฤดูกาล',
        body: 'นี่คือช่วงเวลาที่ดีในการตรวจสอบข้อเสนอสปอนเซอร์ใหม่ — ผลงานที่ดีขึ้นจะดึงดูดสปอนเซอร์รายใหญ่ขึ้น',
      });
    }
    if (matchday === threeQuarter && threeQuarter > half) {
      events.push({
        category: 'board',
        title: 'โค้งสุดท้ายของฤดูกาล',
        body: 'เหลืออีกไม่กี่นัดจะจบฤดูกาล บอร์ดจะประเมินผลงานทั้งฤดูกาลและตัดสินใจเรื่องเลื่อนชั้น/ตกชั้นเมื่อจบซีซั่น',
      });
    }
  }

  return events;
}
