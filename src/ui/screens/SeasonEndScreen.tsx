import type { GameState } from '../../app/gameState';
import type { SeasonOutcome } from '../../app/endSeason';
import { formatBaht } from '../../core/money';
import { LeagueTable } from '../components/LeagueTable';
import { ALL_CLUBS } from '../../data/clubs.seed';

const CLUB_NAMES: Record<string, string> = Object.fromEntries(
  ALL_CLUBS.map((club) => [club.id, club.shortName]),
);

interface Props {
  state: GameState;
  outcome: SeasonOutcome;
  onContinue: () => void;
}

const OUTCOME_LABEL: Record<SeasonOutcome['outcome'], string> = {
  promoted: 'เลื่อนชั้น',
  relegated: 'ตกชั้น',
  stayed: 'อยู่ลีกเดิม',
};

const OUTCOME_BADGE: Record<SeasonOutcome['outcome'], string> = {
  promoted: 'ok',
  relegated: 'bad',
  stayed: '',
};

/**
 * End-of-season summary. Presentation only: the verdict comes from the board
 * system and the movements from the league system — this screen renders what
 * they decided and offers the one button that rolls the career forward.
 */
export function SeasonEndScreen({ state, outcome, onContinue }: Props) {
  const clubName = (clubId: string) => state.clubs[clubId]?.shortName ?? clubId;
  // Promoted and relegated clubs can come from tiers the player is not in,
  // so their names come from the static club data rather than from state,
  // which only carries the player's own competition.
  const anyName = (clubId: string) =>
    state.clubs[clubId]?.shortName ?? CLUB_NAMES[clubId] ?? clubId;

  return (
    <div>
      <header className="header">
        <div>
          <div className="title">จบฤดูกาล {outcome.year}</div>
          <div className="sub">
            {outcome.competitionId}
            {outcome.zone ? ` · โซน${outcome.zone}` : ''} · จบอันดับที่ {outcome.finalPosition}
          </div>
        </div>
        <span className={`badge ${OUTCOME_BADGE[outcome.outcome]}`} data-testid="season-outcome">
          {OUTCOME_LABEL[outcome.outcome]}
        </span>
      </header>

      <section className="stats">
        <div className="stat">
          <small>อันดับสุดท้าย</small>
          <b data-testid="final-position">#{outcome.finalPosition}</b>
        </div>
        <div className="stat">
          <small>ความเชื่อมั่นบอร์ด</small>
          <b data-testid="final-confidence">{outcome.verdict.confidence}</b>
        </div>
        <div className="stat">
          <small>เงินคงเหลือ</small>
          <b>{formatBaht(state.finance.balance)}</b>
        </div>
        <div className="stat">
          <small>ฤดูกาลถัดไป</small>
          <b data-testid="next-competition">{outcome.nextCompetitionId}</b>
        </div>
      </section>

      <section className="panel">
        <h3>ผลการประเมินจากบอร์ด</h3>
        {outcome.verdict.verdicts.map((verdict, i) => (
          <div className="effect" key={i} data-testid="objective-verdict">
            <span>
              <span className={`badge ${verdict.met ? 'ok' : 'bad'}`} style={{ marginRight: 8 }}>
                {verdict.met ? 'สำเร็จ' : 'ไม่สำเร็จ'}
              </span>
              {verdict.description}
            </span>
            <span className="muted">{verdict.detail}</span>
          </div>
        ))}
        {outcome.verdict.chairmanUnderPressure && (
          <div className="error" style={{ marginTop: 12, marginBottom: 0 }} data-testid="under-pressure">
            บอร์ดหมดความอดทนกับผลงานของคุณ — ฤดูกาลหน้าต้องพิสูจน์ตัวเอง
          </div>
        )}
      </section>

      {(outcome.promotedClubs.length > 0 || outcome.relegatedClubs.length > 0) && (
        <section className="panel">
          <h3>เลื่อนชั้น / ตกชั้น</h3>
          {outcome.movement.movements.map((movement) => (
            <div key={movement.competitionId} style={{ marginBottom: 12 }}>
              <h4>{movement.competitionId}</h4>
              <div className="effect">
                <span className="muted">ตกชั้น</span>
                <span>{movement.relegated.map(anyName).join(' · ') || '—'}</span>
              </div>
              <div className="effect">
                <span className="muted">เลื่อนขึ้นมา</span>
                <span>{movement.promoted.map(anyName).join(' · ') || '—'}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="panel">
        <h3>ตารางคะแนนสุดท้าย</h3>
        <LeagueTable
          standings={outcome.finalStandings}
          clubName={clubName}
          highlightClubId={state.playerClubId}
        />
      </section>

      {state.history.length > 0 && (
        <section className="panel">
          <h3>ประวัติฤดูกาลที่ผ่านมา</h3>
          {state.history.map((record, i) => (
            <div className="effect" key={i}>
              <span>
                {record.year} · {record.competitionId} · อันดับ {record.finalPosition}
              </span>
              <span className="muted">
                {record.points} คะแนน · {OUTCOME_LABEL[record.outcome]}
              </span>
            </div>
          ))}
        </section>
      )}

      <button
        className="primary"
        style={{ width: '100%' }}
        onClick={onContinue}
        data-testid="start-next-season"
      >
        เริ่มฤดูกาล {outcome.year + 1}
      </button>
    </div>
  );
}
