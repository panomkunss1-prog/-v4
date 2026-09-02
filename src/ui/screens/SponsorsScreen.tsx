import type { GameState } from '../../app/gameState';
import { SPONSOR_CAP, TIER_LABEL } from '../../core/sponsor';
import { formatBaht } from '../../core/money';

interface Props {
  state: GameState;
  onSign: (offerId: string) => string | null;
  error: string | null;
}

const TIER_BADGE: Record<string, string> = { small: '', medium: 'ok', large: 'warn' };

/**
 * Sponsor roster and current offers. Offer tier is decided entirely by the
 * sponsorship system based on performance — this screen only displays and
 * lets the chairman sign, it never invents or ranks offers itself.
 */
export function SponsorsScreen({ state, onSign, error }: Props) {
  const totalIncome = state.sponsors.reduce((sum, s) => sum + s.incomePerMatchday, 0);
  const atCap = state.sponsors.length >= SPONSOR_CAP;

  return (
    <div>
      {error && <div className="error" data-testid="sponsor-error">{error}</div>}

      <section className="stats">
        <div className="stat">
          <small>สปอนเซอร์ที่เซ็นแล้ว</small>
          <b data-testid="sponsor-count">{state.sponsors.length} / {SPONSOR_CAP}</b>
        </div>
        <div className="stat">
          <small>รายได้จากสปอนเซอร์/นัด</small>
          <b data-testid="sponsor-income">{formatBaht(totalIncome)}</b>
        </div>
      </section>

      <section className="panel">
        <h3>ข้อเสนอสปอนเซอร์ปัจจุบัน</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          ทีมที่ผลงานดีจะได้รับข้อเสนอจากสปอนเซอร์รายใหญ่มากขึ้น ส่วนทีมที่ผลงานย่ำแย่จะมีแต่รายเล็กเข้ามา
          ข้อเสนอจะปรับใหม่ทุกนัดตามผลงานล่าสุด
        </p>
        {state.sponsorOffers.length === 0 && <div className="muted">ยังไม่มีข้อเสนอในขณะนี้</div>}
        {state.sponsorOffers.map((offer) => (
          <div className="effect" key={offer.id} data-testid={`offer-${offer.id}`}>
            <span>
              {offer.name}{' '}
              <span className={`badge ${TIER_BADGE[offer.tier]}`}>{TIER_LABEL[offer.tier]}</span>
            </span>
            <span className="row-between" style={{ gap: 10 }}>
              <b>{formatBaht(offer.incomePerMatchday)}/นัด</b>
              <button
                className="ghost"
                disabled={atCap}
                data-testid={`sign-${offer.id}`}
                onClick={() => onSign(offer.id)}
              >
                เซ็นสัญญา
              </button>
            </span>
          </div>
        ))}
        {atCap && <div className="notice" style={{ marginTop: 12, marginBottom: 0 }}>มีสปอนเซอร์ครบ {SPONSOR_CAP} รายแล้ว</div>}
      </section>

      <section className="panel">
        <h3>สปอนเซอร์ที่เซ็นสัญญาแล้ว</h3>
        {state.sponsors.length === 0 && <div className="muted">ยังไม่มีสปอนเซอร์</div>}
        {state.sponsors.map((sponsor) => (
          <div className="effect" key={sponsor.id} data-testid={`sponsor-${sponsor.id}`}>
            <span>
              {sponsor.name}{' '}
              <span className={`badge ${TIER_BADGE[sponsor.tier]}`}>{TIER_LABEL[sponsor.tier]}</span>
            </span>
            <span>
              <b>{formatBaht(sponsor.incomePerMatchday)}/นัด</b>
              <span className="muted"> · นัดที่ {sponsor.signedOnMatchday}</span>
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
