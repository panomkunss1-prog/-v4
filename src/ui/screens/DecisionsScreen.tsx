import { useState } from 'react';
import type { GameState } from '../../app/gameState';
import type { DecisionType } from '../../core/decision';
import { formatBaht } from '../../core/money';
import { ConsequenceList } from '../components/ConsequenceList';

interface Props {
  state: GameState;
  onDecide: (type: DecisionType, amount: number) => string | null;
}

/**
 * Executive decisions only. Every control here is an ORGANISATIONAL lever —
 * budget and investment. There is deliberately no control for Starting XI,
 * formation, tactics or substitutions (brief PLAYER ROLE / §17).
 */
export function DecisionsScreen({ state, onDecide }: Props) {
  const [budget, setBudget] = useState('5000000');
  const [academy, setAcademy] = useState('8000000');
  const [error, setError] = useState<string | null>(null);

  const submit = (type: DecisionType, raw: string) => {
    const amount = Number(raw);
    if (!Number.isFinite(amount)) {
      setError('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }
    setError(onDecide(type, amount));
  };

  const latest = state.decisions[state.decisions.length - 1];

  return (
    <div>
      <section className="panel">
        <h3>การตัดสินใจระดับบริหาร</h3>
        <p className="muted" style={{ lineHeight: 1.7, marginTop: 0 }}>
          คุณตัดสินใจเรื่ององค์กรเท่านั้น การเลือกตัวผู้เล่นและแทคติกเป็นหน้าที่ของผู้จัดการทีม
        </p>
        <div className="muted">เงินคงเหลือปัจจุบัน: <b>{formatBaht(state.finance.balance)}</b></div>
      </section>

      {error && <div className="error" data-testid="decision-error">{error}</div>}

      <section className="panel">
        <h3>จัดสรรงบซื้อตัว</h3>
        <div className="field">
          <label htmlFor="budget-input">จำนวนเงิน (บาท)</label>
          <input
            id="budget-input"
            data-testid="budget-input"
            type="number"
            min="0"
            step="100000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <button
          className="primary"
          data-testid="apply-budget"
          onClick={() => submit('budget_allocation', budget)}
        >
          อนุมัติงบประมาณ
        </button>
      </section>

      <section className="panel">
        <h3>ลงทุนอะคาเดมี</h3>
        <div className="field">
          <label htmlFor="academy-input">จำนวนเงิน (บาท) — ทุก 4 ล้านบาทยกระดับอะคาเดมี 1 ระดับ</label>
          <input
            id="academy-input"
            data-testid="academy-input"
            type="number"
            min="0"
            step="1000000"
            value={academy}
            onChange={(e) => setAcademy(e.target.value)}
          />
        </div>
        <button
          className="primary"
          data-testid="apply-academy"
          onClick={() => submit('academy_investment', academy)}
        >
          อนุมัติการลงทุน
        </button>
      </section>

      {latest && (
        <section className="panel" data-testid="latest-decision">
          <h3>ผลลัพธ์ล่าสุด</h3>
          <div className="muted" style={{ marginBottom: 10 }}>
            {latest.summary} · นัดที่ {latest.appliedOnMatchday}
          </div>
          <ConsequenceList effects={latest.effects} />
        </section>
      )}

      {state.decisions.length > 0 && (
        <section className="panel">
          <h3>ประวัติการตัดสินใจ ({state.decisions.length})</h3>
          {state.decisions.map((decision) => (
            <div className="effect" key={decision.id}>
              <span>{decision.summary}</span>
              <span className="muted">นัดที่ {decision.appliedOnMatchday}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
