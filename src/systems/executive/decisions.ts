import type { Club } from '../../core/club';
import type { BoardState, FanState } from '../../core/board';
import type { FinanceState } from '../../core/finance';
import type { ConsequenceEffect, DecisionParams, DecisionType } from '../../core/decision';
import type { ChairmanProfile } from '../../core/chairman';
import type { Sponsor, SponsorOffer } from '../../core/sponsor';
import { clamp, err, ok, type Result } from '../../core/result';
import { post } from '../finance/ledger';
import { upgradeStadium } from '../facilities/stadium';
import { upgradeTrainingFacility } from '../facilities/training';
import { canSignMore, signSponsor } from '../sponsorship/offers';

/**
 * EXECUTIVE SYSTEM. Every decision is an organisational lever — budget,
 * investment, objectives, staff. None of them touches team selection,
 * formation, tactics or in-match actions (brief §5 / PLAYER ROLE).
 *
 * Decisions are pluggable: adding a type means adding a handler here, not
 * editing the UI. Slice 1 wires two of the ten types listed in core/decision.
 */
export interface ExecutiveContext {
  club: Club;
  chairman: ChairmanProfile;
  finance: FinanceState;
  board: BoardState;
  fans: FanState;
  matchday: number;
  sponsors: Sponsor[];
  sponsorOffers: SponsorOffer[];
}

export interface DecisionOutcome {
  finance: FinanceState;
  board: BoardState;
  fans: FanState;
  club: Club;
  cost: number;
  summary: string;
  effects: ConsequenceEffect[];
  /** Present only for decisions that touch the sponsor roster. */
  sponsors?: Sponsor[];
  signedOfferId?: string;
}

export type DecisionHandler = (
  context: ExecutiveContext,
  params: DecisionParams,
) => Result<DecisionOutcome>;

const effect = (
  system: ConsequenceEffect['system'],
  label: string,
  before: number,
  after: number,
): ConsequenceEffect => ({ system, label, before, after });

/**
 * Budget allocation: the chairman moves money into the transfer and wage
 * budgets. Negotiation skill reduces the effective drag on board confidence.
 */
const budgetAllocation: DecisionHandler = (ctx, params) => {
  const transferBudget = Math.max(0, Math.round(params.transferBudget ?? 0));
  if (transferBudget <= 0) return err('ต้องระบุงบประมาณมากกว่า 0');
  if (transferBudget > ctx.finance.balance) {
    return err('งบประมาณเกินเงินคงเหลือของสโมสร');
  }

  const finance = {
    ...ctx.finance,
    transferBudget: ctx.finance.transferBudget + transferBudget,
  };

  // Committing cash pleases fans but spends board goodwill unless the
  // chairman's business sense offsets it.
  const businessOffset = ctx.chairman.attributes.business * 0.15;
  const confidenceDelta = Math.round(
    clamp(3 - transferBudget / 8_000_000 + businessOffset, -8, 6),
  );
  const moodDelta = Math.round(clamp(transferBudget / 5_000_000, 0, 8));

  const board = { ...ctx.board, confidence: clamp(ctx.board.confidence + confidenceDelta, 0, 100) };
  const fans = { mood: clamp(ctx.fans.mood + moodDelta, 0, 100) };

  return ok({
    finance,
    board,
    fans,
    club: ctx.club,
    cost: 0,
    summary: `จัดสรรงบซื้อตัว ${transferBudget.toLocaleString('th-TH')} บาท`,
    effects: [
      effect('finance', 'งบซื้อตัว', ctx.finance.transferBudget, finance.transferBudget),
      effect('board', 'ความเชื่อมั่นบอร์ด', ctx.board.confidence, board.confidence),
      effect('fans', 'อารมณ์แฟนบอล', ctx.fans.mood, fans.mood),
    ],
  });
};

/** Academy investment: spends cash now for a lasting club rating increase. */
const academyInvestment: DecisionHandler = (ctx, params) => {
  const investment = Math.max(0, Math.round(params.investment ?? 0));
  if (investment <= 0) return err('ต้องระบุจำนวนเงินลงทุนมากกว่า 0');
  if (investment > ctx.finance.balance) return err('เงินลงทุนเกินเงินคงเหลือของสโมสร');

  const gain = clamp(Math.round(investment / 4_000_000), 0, 5);
  if (gain === 0) return err('จำนวนเงินน้อยเกินไปที่จะยกระดับอะคาเดมี');

  const finance = post(
    ctx.finance,
    ctx.matchday,
    'academy_investment',
    -investment,
    'ลงทุนอะคาเดมี',
  );
  const club = { ...ctx.club, academy: clamp(ctx.club.academy + gain, 1, 20) };
  const board = { ...ctx.board, confidence: clamp(ctx.board.confidence + 2, 0, 100) };

  return ok({
    finance,
    board,
    fans: ctx.fans,
    club,
    cost: investment,
    summary: `ลงทุนอะคาเดมี ${investment.toLocaleString('th-TH')} บาท`,
    effects: [
      effect('finance', 'เงินคงเหลือ', ctx.finance.balance, finance.balance),
      effect('club', 'ระดับอะคาเดมี', ctx.club.academy, club.academy),
      effect('board', 'ความเชื่อมั่นบอร์ด', ctx.board.confidence, board.confidence),
    ],
  });
};

/** Stadium investment: spends cash now for permanent extra capacity. */
const stadiumInvestment: DecisionHandler = (ctx, params) => {
  const investment = Math.max(0, Math.round(params.investment ?? 0));
  if (investment <= 0) return err('ต้องระบุจำนวนเงินลงทุนมากกว่า 0');
  if (investment > ctx.finance.balance) return err('เงินลงทุนเกินเงินคงเหลือของสโมสร');

  const club = upgradeStadium(ctx.club, investment);
  if (club.stadiumCapacity === ctx.club.stadiumCapacity) {
    return err('จำนวนเงินน้อยเกินไปที่จะขยายความจุสนาม หรือสนามเต็มความจุสูงสุดของ Prototype แล้ว');
  }

  const finance = post(ctx.finance, ctx.matchday, 'stadium_investment', -investment, `ปรับปรุง${ctx.club.stadiumName}`);
  const board = { ...ctx.board, confidence: clamp(ctx.board.confidence + 1, 0, 100) };
  const fans = { mood: clamp(ctx.fans.mood + 3, 0, 100) };

  return ok({
    finance,
    board,
    fans,
    club,
    cost: investment,
    summary: `ปรับปรุง${ctx.club.stadiumName} ด้วยงบ ${investment.toLocaleString('th-TH')} บาท`,
    effects: [
      effect('finance', 'เงินคงเหลือ', ctx.finance.balance, finance.balance),
      effect('club', 'ความจุสนาม', ctx.club.stadiumCapacity, club.stadiumCapacity),
      effect('fans', 'อารมณ์แฟนบอล', ctx.fans.mood, fans.mood),
    ],
  });
};

/**
 * Training facility investment (brief request #3): raises the level that
 * systems/facilities/training reads each matchday to grow player ability.
 */
const facilitiesInvestment: DecisionHandler = (ctx, params) => {
  const investment = Math.max(0, Math.round(params.investment ?? 0));
  if (investment <= 0) return err('ต้องระบุจำนวนเงินลงทุนมากกว่า 0');
  if (investment > ctx.finance.balance) return err('เงินลงทุนเกินเงินคงเหลือของสโมสร');

  const club = upgradeTrainingFacility(ctx.club, investment);
  if (club.trainingFacilityLevel === ctx.club.trainingFacilityLevel) {
    return err('จำนวนเงินน้อยเกินไปที่จะยกระดับสนามฝึกซ้อม หรือถึงระดับสูงสุดแล้ว');
  }

  const finance = post(ctx.finance, ctx.matchday, 'facilities_investment', -investment, 'ปรับปรุงสนามฝึกซ้อม');
  const board = { ...ctx.board, confidence: clamp(ctx.board.confidence + 1, 0, 100) };

  return ok({
    finance,
    board,
    fans: ctx.fans,
    club,
    cost: investment,
    summary: `ปรับปรุงสนามฝึกซ้อมด้วยงบ ${investment.toLocaleString('th-TH')} บาท`,
    effects: [
      effect('finance', 'เงินคงเหลือ', ctx.finance.balance, finance.balance),
      effect('club', 'ระดับสนามฝึกซ้อม', ctx.club.trainingFacilityLevel, club.trainingFacilityLevel),
      effect('board', 'ความเชื่อมั่นบอร์ด', ctx.board.confidence, board.confidence),
    ],
  });
};

/** Signs one sponsor from the current offer list, subject to the 10-sponsor cap. */
const signSponsorDecision: DecisionHandler = (ctx, params) => {
  const offer = ctx.sponsorOffers.find((o) => o.id === params.sponsorOfferId);
  if (!offer) return err('ไม่พบข้อเสนอสปอนเซอร์นี้ อาจถูกแทนที่ไปแล้ว');
  if (!canSignMore(ctx.sponsors)) return err('มีสปอนเซอร์ครบ 10 รายแล้ว ต้องยกเลิกรายเดิมก่อนเซ็นรายใหม่');

  const sponsors = signSponsor(ctx.sponsors, offer, ctx.matchday);
  const board = { ...ctx.board, confidence: clamp(ctx.board.confidence + 1, 0, 100) };

  return ok({
    finance: ctx.finance,
    board,
    fans: ctx.fans,
    club: ctx.club,
    cost: 0,
    summary: `เซ็นสัญญากับ ${offer.name} (${offer.incomePerMatchday.toLocaleString('th-TH')} บาท/นัด)`,
    effects: [
      effect('finance', 'จำนวนสปอนเซอร์', ctx.sponsors.length, sponsors.length),
      effect('board', 'ความเชื่อมั่นบอร์ด', ctx.board.confidence, board.confidence),
    ],
    sponsors,
    signedOfferId: offer.id,
  });
};

/** Registered handlers. Unwired types are rejected, never silently ignored. */
export const DECISION_HANDLERS: Partial<Record<DecisionType, DecisionHandler>> = {
  budget_allocation: budgetAllocation,
  academy_investment: academyInvestment,
  stadium_investment: stadiumInvestment,
  facilities_investment: facilitiesInvestment,
  sign_sponsor: signSponsorDecision,
};

export function decide(
  type: DecisionType,
  context: ExecutiveContext,
  params: DecisionParams,
): Result<DecisionOutcome> {
  const handler = DECISION_HANDLERS[type];
  if (!handler) return err(`ยังไม่รองรับการตัดสินใจประเภท: ${type} (นอกขอบเขต Slice 1)`);
  return handler(context, params);
}
