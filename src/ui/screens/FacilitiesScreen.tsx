import { useState } from 'react';
import type { GameState } from '../../app/gameState';
import type { DecisionType } from '../../core/decision';
import { formatBaht } from '../../core/money';
import { TRAINING_FACILITY_MAX } from '../../core/club';
import { ConsequenceList } from '../components/ConsequenceList';

interface Props {
  state: GameState;
  onDecide: (type: DecisionType, params: { investment: number }) => string | null;
}

/**
 * Stadium and training-ground investment. Both levers are organisational —
 * capacity/infrastructure spend — never a match-day or tactical control.
 */
export function FacilitiesScreen({ state, onDecide }: Props) {
  const club = state.clubs[state.playerClubId];
  const [stadiumAmount, setStadiumAmount] = useState('20000000');
  const [trainingAmount, setTrainingAmount] = useState('12000000');
  const [error, setError] = useState<string | null>(null);

  if (!club) return null;

  const submit = (type: DecisionType, raw: string) => {
    const amount = Number(raw);
    if (!Number.isFinite(amount)) {
      setError('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }
    setError(onDecide(type, { investment: amount }));
  };

  const latest = [...state.decisions]
    .reverse()
    .find((d) => d.type === 'stadium_investment' || d.type === 'facilities_investment');

  return (
    <div>
      {error && <div className="error" data-testid="facilities-error">{error}</div>}

      <section className="panel">
        <h3 data-testid="stadium-name">{club.stadiumName}</h3>
        <div className="attrs">
          <div className="attr"><span>ความจุปัจจุบัน</span><b data-testid="stadium-capacity">{club.stadiumCapacity.toLocaleString('th-TH')} ที่นั่ง</b></div>
          <div className="attr"><span>เมือง</span><b>{club.city}</b></div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="stadium-input">งบปรับปรุงสนาม (บาท)</label>
          <input
            id="stadium-input"
            data-testid="stadium-input"
            type="number"
            min="0"
            step="1000000"
            value={stadiumAmount}
            onChange={(e) => setStadiumAmount(e.target.value)}
          />
        </div>
        <button className="primary" data-testid="apply-stadium" onClick={() => submit('stadium_investment', stadiumAmount)}>
          อนุมัติปรับปรุงสนาม
        </button>
      </section>

      <section className="panel">
        <h3>สนามฝึกซ้อม</h3>
        <div className="attrs">
          <div className="attr">
            <span>ระดับปัจจุบัน</span>
            <b data-testid="training-level">{club.trainingFacilityLevel} / {TRAINING_FACILITY_MAX}</b>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          สนามฝึกซ้อมที่ดีขึ้นช่วยให้นักเตะในทีม โดยเฉพาะนักเตะดาวรุ่งอายุไม่เกิน 23 ปี
          มีโอกาสพัฒนาความสามารถขึ้นทุกนัดที่แข่งขัน
        </p>
        <div className="field" style={{ marginTop: 4 }}>
          <label htmlFor="training-input">งบปรับปรุงสนามฝึกซ้อม (บาท) — ทุก 12 ล้านบาทยกระดับ 1 ขั้น</label>
          <input
            id="training-input"
            data-testid="training-input"
            type="number"
            min="0"
            step="1000000"
            value={trainingAmount}
            onChange={(e) => setTrainingAmount(e.target.value)}
          />
        </div>
        <button className="primary" data-testid="apply-training" onClick={() => submit('facilities_investment', trainingAmount)}>
          อนุมัติปรับปรุงสนามฝึกซ้อม
        </button>
      </section>

      {latest && (
        <section className="panel" data-testid="latest-facility-decision">
          <h3>ผลลัพธ์ล่าสุด</h3>
          <div className="muted" style={{ marginBottom: 10 }}>
            {latest.summary} · นัดที่ {latest.appliedOnMatchday}
          </div>
          <ConsequenceList effects={latest.effects} />
        </section>
      )}

      <div className="footnote">
        ค่าใช้จ่ายปรับปรุงสนาม: {formatBaht(20_000_000)} ≈ เพิ่มความจุได้ราว 5,700 ที่นั่ง (ขึ้นอยู่กับความจุปัจจุบัน)
      </div>
    </div>
  );
}
