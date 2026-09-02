/**
 * RUNTIME VERIFICATION — brief §15.
 *
 * Drives the real built app in Chromium and records evidence for each
 * acceptance step. Every console error is captured and fails the run: a
 * silently broken page must never be reported as PASS.
 *
 * Run: npm run build && npm run preview &  then  node e2e/runtime-verification.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = 'e2e/evidence';
mkdirSync(OUT, { recursive: true });

const steps = [];
const consoleErrors = [];
let shot = 0;

function record(name, status, detail) {
  steps.push({ name, status, detail });
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '·';
  console.log(`${icon} [${status}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function snap(page, label) {
  shot += 1;
  const file = `${OUT}/${String(shot).padStart(2, '0')}-${label}.png`;
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

const text = (page, id) => page.getByTestId(id).innerText();
const num = async (page, id) => Number((await text(page, id)).replace(/[^0-9.-]/g, ''));

// The environment ships Chromium at a fixed path; point Playwright at it
// rather than downloading a build (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD is set).
const EXECUTABLE = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: EXECUTABLE });
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

try {
  // ---- 1. App loads -------------------------------------------------------
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByTestId('new-career').waitFor({ timeout: 10000 });
  record('1. แอปโหลดได้ (app loads)', 'PASS', await snap(page, 'start'));

  // ---- 2. New career ------------------------------------------------------
  await page.getByTestId('new-career').click();
  await page.getByTestId('chairman-name').waitFor();
  record('2. เริ่มอาชีพใหม่ (new career)', 'PASS', 'reached chairman creation');

  // ---- 3. Chairman creation ----------------------------------------------
  await page.getByTestId('chairman-name').fill('สมชาย ทดสอบ');
  await page.getByTestId('background-former_footballer').click();
  const knowledgeFootballer = await num(page, 'attr-footballKnowledge');
  await page.getByTestId('background-businessperson').click();
  const knowledgeBusiness = await num(page, 'attr-footballKnowledge');
  const businessValue = await num(page, 'attr-business');
  await page.getByTestId('personality-ambitious').click();
  await page.getByTestId('goal-promotion').click();
  const chairmanShot = await snap(page, 'chairman-creation');

  record(
    '3. สร้างประธานพร้อม attributes (chairman created)',
    knowledgeFootballer > knowledgeBusiness && businessValue > 8 ? 'PASS' : 'FAIL',
    `footballKnowledge: อดีตนักฟุตบอล=${knowledgeFootballer} vs นักธุรกิจ=${knowledgeBusiness}; business=${businessValue} · ${chairmanShot}`,
  );

  // ---- 4. Club selection --------------------------------------------------
  await page.getByTestId('confirm-chairman').click();
  await page.getByTestId('confirm-club').waitFor();
  const clubShot = await snap(page, 'club-selection');
  await page.getByTestId('club-T1-01').click();
  await page.getByTestId('confirm-club').click();
  await page.getByTestId('club-name').waitFor({ timeout: 10000 });
  const clubName = await text(page, 'club-name');
  record('4. เลือกสโมสรได้ (club selected)', 'PASS', `${clubName} · ${clubShot}`);

  // ---- 5. Dashboard shows organisation state ------------------------------
  const balance0 = await num(page, 'balance');
  const confidence0 = await num(page, 'board-confidence');
  const academy0 = await num(page, 'academy-rating');
  const budget0 = await num(page, 'transfer-budget');
  const managerName = await text(page, 'manager-name');
  const registration = await text(page, 'registration-status');
  const foreign = await text(page, 'foreign-count');
  const dashShot = await snap(page, 'dashboard-before');
  record(
    '5. เห็นสถานะสโมสร/บอร์ด/ผู้จัดการ (dashboard state)',
    balance0 > 0 && managerName.length > 0 ? 'PASS' : 'FAIL',
    `balance=${balance0}, confidence=${confidence0}, academy=${academy0}, manager=${managerName}, registration=${registration}, foreign=${foreign} · ${dashShot}`,
  );

  // ---- 6. Executive decision changes state --------------------------------
  await page.getByTestId('nav-decisions').click();
  await page.getByTestId('budget-input').fill('5000000');
  await page.getByTestId('apply-budget').click();
  await page.getByTestId('latest-decision').waitFor();
  const decisionShot = await snap(page, 'decision-consequence');

  await page.getByTestId('academy-input').fill('8000000');
  await page.getByTestId('apply-academy').click();
  await page.waitForTimeout(200);

  await page.getByTestId('nav-dashboard').click();
  await page.getByTestId('balance').waitFor();
  const balance1 = await num(page, 'balance');
  const academy1 = await num(page, 'academy-rating');
  const budget1 = await num(page, 'transfer-budget');
  const dashAfterShot = await snap(page, 'dashboard-after-decision');

  const stateChanged = balance1 < balance0 && academy1 > academy0 && budget1 > budget0;
  record(
    '6. ตัดสินใจแล้ว state เปลี่ยนจริง (decision changes state)',
    stateChanged ? 'PASS' : 'FAIL',
    `balance ${balance0}→${balance1}, academy ${academy0}→${academy1}, transferBudget ${budget0}→${budget1} · ${decisionShot} · ${dashAfterShot}`,
  );

  // ---- 7. Advance matchday ------------------------------------------------
  await page.getByTestId('nav-matchday').click();
  await page.getByTestId('advance-matchday').waitFor();
  const fixturesShot = await snap(page, 'fixtures-before');
  const counter0 = await text(page, 'matchday-counter').catch(() => 'n/a');

  await page.getByTestId('advance-matchday').click();
  await page.getByTestId('own-result').waitFor({ timeout: 10000 });
  const score = await text(page, 'own-score');
  const resultShot = await snap(page, 'match-result');
  record(
    '7. เลื่อน matchday และได้ผลการแข่งขัน (matchday + result)',
    /\d+\s*-\s*\d+/.test(score) ? 'PASS' : 'FAIL',
    `own score = ${score} · ${fixturesShot} · ${resultShot}`,
  );

  // ---- 8. League table updates -------------------------------------------
  const rows = await page.locator('[data-testid="league-table"] tbody tr').count();
  const points1 = await num(page, 'my-points');
  const allPoints = await page
    .locator('[data-testid="league-table"] tbody tr td:last-child')
    .allInnerTexts();
  const totalPoints = allPoints.reduce((s, t) => s + Number(t), 0);
  const tableShot = await snap(page, 'league-table-after-md1');
  record(
    '8. ตารางคะแนนอัปเดตตามผลจริง (standings update)',
    rows === 16 && totalPoints >= 16 && totalPoints <= 24 ? 'PASS' : 'FAIL',
    `rows=${rows}, my points=${points1}, total points across table=${totalPoints} (expect 16-24 for 8 matches) · ${tableShot}`,
  );

  // ---- 9. Multiple matchdays keep the table consistent --------------------
  for (let i = 0; i < 4; i += 1) {
    await page.getByTestId('advance-matchday').click();
    await page.waitForTimeout(120);
  }
  const played = await page
    .locator('[data-testid="league-table"] tbody tr td:nth-child(3)')
    .allInnerTexts();
  const allPlayed5 = played.every((p) => Number(p) === 5);
  const multiShot = await snap(page, 'league-table-after-md5');
  record(
    '9. เล่นต่อเนื่องหลายนัด ตารางยังถูกต้อง (multi-matchday)',
    allPlayed5 ? 'PASS' : 'FAIL',
    `every club played = ${played.slice(0, 3).join(',')}... · ${multiShot}`,
  );

  // ---- 10. Consequences visible on dashboard ------------------------------
  await page.getByTestId('nav-dashboard').click();
  await page.getByTestId('balance').waitFor();
  const balance2 = await num(page, 'balance');
  const confidence2 = await num(page, 'board-confidence');
  const position2 = await text(page, 'league-position');
  const counter2 = await text(page, 'matchday-counter');
  const consequenceShot = await snap(page, 'dashboard-consequences');
  record(
    '10. Consequence ทางการเงิน/บอร์ดเปลี่ยนตามผล (consequences)',
    balance2 !== balance1 && position2 !== '—' ? 'PASS' : 'FAIL',
    `balance ${balance1}→${balance2}, confidence ${confidence0}→${confidence2}, position=${position2}, matchday ${counter0}→${counter2} · ${consequenceShot}`,
  );

  // ---- 11. Save/restore ---------------------------------------------------
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByTestId('continue-career').click();
  await page.getByTestId('balance').waitFor({ timeout: 10000 });
  const balanceRestored = await num(page, 'balance');
  record(
    '11. เซฟและโหลดต่อได้ (save/restore)',
    balanceRestored === balance2 ? 'PASS' : 'FAIL',
    `balance after reload = ${balanceRestored} (expected ${balance2})`,
  );

  // ---- 12. No manager-mode controls anywhere ------------------------------
  const forbidden = ['เลือกตัวจริง', 'แผนการเล่น', 'แทคติก', 'formation', 'Starting XI', 'เปลี่ยนตัว'];
  const found = [];
  for (const nav of ['nav-dashboard', 'nav-decisions', 'nav-matchday']) {
    await page.getByTestId(nav).click();
    await page.waitForTimeout(120);
    const body = await page.locator('body').innerText();
    for (const term of forbidden) {
      // "แทคติก" appears only inside the read-only explanation that the
      // manager owns tactics; a control would be a button or input.
      const controls = await page
        .locator(`button:has-text("${term}"), input[name*="${term}"], select:has-text("${term}")`)
        .count();
      if (controls > 0) found.push(`${term} control on ${nav}`);
      void body;
    }
  }
  record(
    '12. ไม่มี UI ให้ผู้เล่นคุมตัวจริง/แทคติก (no manager mode)',
    found.length === 0 ? 'PASS' : 'FAIL',
    found.length === 0 ? 'no lineup/formation/tactics/substitution controls found' : found.join('; '),
  );

  // ---- 13. Season end is out of scope, and says so ------------------------
  record(
    '13. จบฤดูกาล + เลื่อนชั้น/ตกชั้น (season end + promotion/relegation)',
    'NOT EXECUTED',
    'Out of authorised Slice 1 scope — deferred to Slice 2. The app states this explicitly when the season completes.',
  );
} catch (error) {
  record('RUN', 'FAIL', `${error}`);
  await snap(page, 'failure').catch(() => {});
} finally {
  record(
    'Console errors',
    consoleErrors.length === 0 ? 'PASS' : 'FAIL',
    consoleErrors.length === 0 ? 'none' : consoleErrors.join(' | '),
  );

  console.log('\n================ RUNTIME VERIFICATION SUMMARY ================');
  const counts = steps.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }), {});
  console.log(JSON.stringify(counts));
  const failed = steps.filter((s) => s.status === 'FAIL');
  console.log(failed.length === 0 ? 'NO FAILURES' : `FAILURES: ${failed.map((f) => f.name).join(', ')}`);
  await browser.close();
  process.exit(failed.length === 0 ? 0 : 1);
}
