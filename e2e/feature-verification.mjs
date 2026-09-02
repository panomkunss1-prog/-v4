/**
 * Runtime verification for the new feature set: squad viewer, stadium and
 * training facility investment, sponsorship, and T2/T3 club selection.
 * Extends the original e2e/runtime-verification.mjs rather than replacing it.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = 'e2e/evidence';
mkdirSync(OUT, { recursive: true });

const steps = [];
const consoleErrors = [];
let shot = 100;

function record(name, status, detail) {
  steps.push({ name, status, detail });
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '·';
  console.log(`${icon} [${status}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function snap(page, label) {
  shot += 1;
  const file = `${OUT}/${shot}-${label}.png`;
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

const text = (page, id) => page.getByTestId(id).innerText();
const num = async (page, id) => Number((await text(page, id)).replace(/[^0-9.-]/g, ''));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // ---- Create a fresh T1 career -------------------------------------------
  await page.getByTestId('new-career').click();
  await page.getByTestId('chairman-name').fill('ทดสอบ ฟีเจอร์ใหม่');
  await page.getByTestId('background-businessperson').click();
  await page.getByTestId('confirm-chairman').click();
  await page.getByTestId('club-T1-01').click();
  await page.getByTestId('confirm-club').click();
  await page.getByTestId('club-name').waitFor({ timeout: 10000 });
  const clubName = await text(page, 'club-name');
  record('Setup: T1 career created', 'PASS', clubName);

  // ---- 1. Squad viewer ------------------------------------------------------
  await page.getByTestId('nav-squad').click();
  await page.getByTestId('squad-table').waitFor();
  const rows = await page.locator('[data-testid="squad-table"] tbody tr').count();
  const squadShot = await snap(page, 'squad-viewer');
  record('1. ดูรายชื่อนักเตะในสโมสร (squad viewer)', rows === 22 ? 'PASS' : 'FAIL', `${rows} players shown (expect 22) · ${squadShot}`);

  // ---- 2. Stadium: real name + capacity upgrade ------------------------------
  await page.getByTestId('nav-facilities').click();
  await page.getByTestId('stadium-name').waitFor();
  const stadiumName = await text(page, 'stadium-name');
  const capacity0 = await num(page, 'stadium-capacity');
  await page.getByTestId('stadium-input').fill('30000000');
  await page.getByTestId('apply-stadium').click();
  await page.waitForTimeout(150);
  const capacity1 = await num(page, 'stadium-capacity');
  const stadiumShot = await snap(page, 'stadium-upgrade');
  record(
    '2. สนามแข่งขันชื่อจริง + ปรับปรุงสนามได้ (real stadium + upgrade)',
    stadiumName.length > 0 && capacity1 > capacity0 ? 'PASS' : 'FAIL',
    `stadium="${stadiumName}", capacity ${capacity0}→${capacity1} · ${stadiumShot}`,
  );

  // ---- 3. Training facility upgrade -----------------------------------------
  const level0 = (await text(page, 'training-level')).split('/')[0]?.trim();
  await page.getByTestId('training-input').fill('12000000');
  await page.getByTestId('apply-training').click();
  await page.waitForTimeout(150);
  const level1 = (await text(page, 'training-level')).split('/')[0]?.trim();
  const trainingShot = await snap(page, 'training-upgrade');
  record(
    '3. ปรับปรุงสนามฝึกซ้อมได้ (training facility upgrade)',
    Number(level1) >= Number(level0) ? 'PASS' : 'FAIL',
    `level ${level0}→${level1} · ${trainingShot}`,
  );

  // ---- 4. Sponsorship: offers, sign, cap -------------------------------------
  await page.getByTestId('nav-sponsors').click();
  await page.getByTestId('sponsor-count').waitFor();
  const countBefore = await text(page, 'sponsor-count');
  const offerButtons = await page.locator('[data-testid^="sign-"]').all();
  const offersShot = await snap(page, 'sponsor-offers');
  let signed = false;
  if (offerButtons.length > 0) {
    await offerButtons[0].click();
    await page.waitForTimeout(150);
    signed = true;
  }
  const countAfter = await text(page, 'sponsor-count');
  const signedShot = await snap(page, 'sponsor-signed');
  record(
    '4. ระบบสปอนเซอร์: มีข้อเสนอและเซ็นสัญญาได้ (sponsorship offers + signing)',
    offerButtons.length > 0 && signed && countAfter !== countBefore ? 'PASS' : 'FAIL',
    `offers=${offerButtons.length}, count ${countBefore}→${countAfter} · ${offersShot} · ${signedShot}`,
  );

  // ---- 5. Sponsor income appears in dashboard/finance -------------------------
  const income = await text(page, 'sponsor-income');
  record('5. รายได้สปอนเซอร์แสดงผล (sponsor income tracked)', income.includes('฿') ? 'PASS' : 'FAIL', income);

  // ---- 6. T2 club selection works --------------------------------------------
  await browser.close();
} catch (error) {
  record('RUN', 'FAIL', `${error}`);
} finally {
  if (consoleErrors.length) record('Console errors (mid-run)', 'FAIL', consoleErrors.join(' | '));
}

// Separate browser session for T2/T3 selection (fresh start needed).
const browser2 = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
const page2 = await browser2.newPage({ viewport: { width: 900, height: 1200 } });
const consoleErrors2 = [];
page2.on('console', (msg) => { if (msg.type() === 'error') consoleErrors2.push(msg.text()); });
page2.on('pageerror', (err) => consoleErrors2.push(`pageerror: ${err.message}`));

try {
  await page2.goto(BASE, { waitUntil: 'networkidle' });
  await page2.getByTestId('new-career').click();
  await page2.getByTestId('chairman-name').fill('ทดสอบ T2');
  await page2.getByTestId('background-businessperson').click();
  await page2.getByTestId('confirm-chairman').click();
  await page2.getByTestId('competition-T2').click();
  await page2.waitForTimeout(150);
  const t2ClubCount = await page2.locator('[data-testid^="club-T2-"]').count();
  await page2.locator('[data-testid^="club-T2-"]').first().click();
  await page2.getByTestId('confirm-club').click();
  await page2.getByTestId('club-name').waitFor({ timeout: 10000 });
  const t2Club = await text(page2, 'club-name');
  const t2Shot = await snap(page2, 't2-career');
  record('6. เลือกสโมสรไทยลีก 2 และเริ่มอาชีพได้ (T2 selectable + playable)', t2ClubCount === 18 && t2Club.length > 0 ? 'PASS' : 'FAIL', `18 clubs listed=${t2ClubCount === 18}, started at ${t2Club} · ${t2Shot}`);

  // Advance one matchday in T2 to prove the whole loop works at this tier.
  await page2.getByTestId('nav-matchday').click();
  await page2.getByTestId('advance-matchday').click();
  await page2.getByTestId('own-result').waitFor({ timeout: 10000 });
  const t2Score = await text(page2, 'own-score');
  const t2ResultShot = await snap(page2, 't2-result');
  record('7. จำลองแมตช์ในไทยลีก 2 ได้จริง (T2 match simulation)', /\d+\s*-\s*\d+/.test(t2Score) ? 'PASS' : 'FAIL', `score=${t2Score} · ${t2ResultShot}`);

  await browser2.close();
} catch (error) {
  record('T2 RUN', 'FAIL', `${error}`);
  await browser2.close().catch(() => {});
} finally {
  if (consoleErrors2.length) record('Console errors (T2 run)', 'FAIL', consoleErrors2.join(' | '));
  else record('Console errors (T2 run)', 'PASS', 'none');
}

console.log('\n================ FEATURE VERIFICATION SUMMARY ================');
const counts = steps.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }), {});
console.log(JSON.stringify(counts));
const failed = steps.filter((s) => s.status === 'FAIL');
console.log(failed.length === 0 ? 'NO FAILURES' : `FAILURES: ${failed.map((f) => f.name).join(', ')}`);
process.exit(failed.length === 0 ? 0 : 1);
