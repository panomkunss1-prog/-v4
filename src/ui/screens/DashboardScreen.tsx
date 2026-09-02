import type { GameState } from '../../app/gameState';
import type { ClubOverview } from '../../app/clubOverview';
import { formatBaht, formatBahtCompact } from '../../core/money';
import { IDENTITY_LABEL, PHILOSOPHY_LABEL } from '../../data/managers.seed';
import { GOAL_LABEL, BACKGROUND_LABEL } from '../../data/chairmanOptions.data';
import { Stat } from '../components/Stat';

interface Props {
  state: GameState;
  overview: ClubOverview;
}

export function DashboardScreen({ state, overview }: Props) {
  const manager = state.managers[state.playerClubId];
  const { club } = overview;

  return (
    <div>
      <section className="stats">
        <Stat label="เงินคงเหลือ" value={formatBaht(state.finance.balance)} testId="balance" />
        <Stat label="งบซื้อตัว" value={formatBahtCompact(state.finance.transferBudget)} testId="transfer-budget" />
        <Stat label="ความเชื่อมั่นบอร์ด" value={`${state.board.confidence}`} testId="board-confidence" />
        <Stat label="อารมณ์แฟนบอล" value={`${state.fans.mood}`} testId="fan-mood" />
        <Stat
          label="อันดับลีก"
          value={overview.leaguePosition > 0 ? `#${overview.leaguePosition}` : '—'}
          testId="league-position"
        />
        <Stat
          label="นัดที่"
          value={`${state.season.currentMatchday}/${state.season.totalMatchdays}`}
          testId="matchday-counter"
        />
      </section>

      <section className="panel">
        <div className="row-between">
          <h3 style={{ margin: 0 }} data-testid="club-name">{club.name}</h3>
          <span className="badge">{state.season.competitionId} · ปี {state.year}</span>
        </div>
        <div className="attrs" style={{ marginTop: 12 }}>
          <div className="attr"><span>ชื่อเสียง</span><b>{club.reputation}</b></div>
          <div className="attr"><span>สนามซ้อม/สิ่งอำนวยความสะดวก</span><b>{club.facilities}</b></div>
          <div className="attr"><span>อะคาเดมี</span><b data-testid="academy-rating">{club.academy}</b></div>
          <div className="attr"><span>ความจุสนาม</span><b>{club.stadiumCapacity.toLocaleString('th-TH')}</b></div>
        </div>
      </section>

      <section className="panel">
        <h3>ประธานสโมสร</h3>
        <div className="attrs">
          <div className="attr"><span>ชื่อ</span><b data-testid="chairman-display">{state.chairman.name}</b></div>
          <div className="attr"><span>ภูมิหลัง</span><b>{BACKGROUND_LABEL[state.chairman.background]}</b></div>
          <div className="attr"><span>เป้าหมาย</span><b>{GOAL_LABEL[state.chairman.goal]}</b></div>
        </div>
      </section>

      <section className="panel">
        <h3>ผู้จัดการทีม (NPC)</h3>
        {manager ? (
          <>
            <div className="attrs">
              <div className="attr"><span>ชื่อ</span><b data-testid="manager-name">{manager.name}</b></div>
              <div className="attr"><span>ความสามารถ</span><b>{manager.ability}</b></div>
              <div className="attr"><span>ปรัชญา</span><b>{PHILOSOPHY_LABEL[manager.philosophy]}</b></div>
              <div className="attr"><span>สไตล์</span><b>{IDENTITY_LABEL[manager.tacticalIdentity]}</b></div>
              <div className="attr"><span>ความสัมพันธ์กับบอร์ด</span><b>{manager.boardRelationship}</b></div>
              <div className="attr"><span>ความสัมพันธ์กับนักเตะ</span><b>{manager.squadRelationship}</b></div>
            </div>
            <div className="notice" style={{ marginTop: 12, marginBottom: 0 }}>
              ผู้จัดการทีมเป็นผู้เลือกตัวผู้เล่นและแทคติกเองทั้งหมด
              ในฐานะประธานสโมสร คุณบริหารองค์กร ไม่สั่งการในสนาม
            </div>
          </>
        ) : (
          <div className="muted">ยังไม่มีผู้จัดการทีม</div>
        )}
      </section>

      <section className="panel">
        <h3>ทีมและการลงทะเบียน</h3>
        <div className="attrs">
          <div className="attr"><span>จำนวนนักเตะ</span><b>{overview.squadSize}</b></div>
          <div className="attr"><span>ความสามารถเฉลี่ย</span><b>{overview.averageAbility}</b></div>
          <div className="attr">
            <span>ผู้เล่นต่างชาติ</span>
            <b data-testid="foreign-count">
              {overview.foreignPlayers}
              {overview.foreignRegistrationLimit !== null && ` / ${overview.foreignRegistrationLimit}`}
            </b>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <span
            className={`badge ${
              overview.registrationStatus === 'COMPLIANT'
                ? 'ok'
                : overview.registrationStatus === 'INDETERMINATE'
                  ? 'warn'
                  : 'bad'
            }`}
            data-testid="registration-status"
          >
            {overview.registrationStatus === 'COMPLIANT'
              ? 'ลงทะเบียนถูกต้อง'
              : overview.registrationStatus === 'INDETERMINATE'
                ? 'ยังสรุปไม่ได้ — โควตาแยกหมวดยังไม่ยืนยัน'
                : 'ผิดระเบียบการลงทะเบียน'}
          </span>
          {overview.regulationNeedsVerification && (
            <span className="badge warn" style={{ marginLeft: 6 }}>NEEDS_VERIFICATION</span>
          )}
          {overview.researchedPlayers > 0 && (
            <span className="badge ok" style={{ marginLeft: 6 }} data-testid="researched-badge">
              ชื่อจริง {overview.researchedPlayers} คน
            </span>
          )}
        </div>
        {(overview.categoryCounts.asean > 0 || overview.categoryCounts.asian > 0) && (
          <div className="muted" style={{ marginTop: 8 }} data-testid="category-breakdown">
            ไทย {overview.categoryCounts.thai} · อาเซียน {overview.categoryCounts.asean} ·
            เอเชีย {overview.categoryCounts.asian} · ต่างชาติทั่วไป {overview.categoryCounts.other}
          </div>
        )}
        {overview.registrationNotes.map((note, i) => (
          <div className="notice" style={{ marginTop: 10, marginBottom: 0 }} key={i} data-testid="registration-note">
            {note}
          </div>
        ))}
        {overview.regulationNote && (
          <div className="notice" style={{ marginTop: 10, marginBottom: 0 }}>
            {overview.regulationNote}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>เป้าหมายจากบอร์ด</h3>
        {state.board.objectives.map((objective, i) => (
          <div className="effect" key={i}>
            <span>{objective.description}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
