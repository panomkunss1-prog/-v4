import type { GameState } from '../../app/gameState';
import type { Standings } from '../../core/standings';
import type { MatchResult } from '../../core/match';
import { LeagueTable } from '../components/LeagueTable';

interface Props {
  state: GameState;
  standings: Standings;
  lastResults: MatchResult[];
  onAdvance: () => void;
  error: string | null;
}

/**
 * Fixtures, results and the league table. Presentation only: results arrive
 * from the match system and the table from the league system. Nothing here
 * simulates a match or computes a standing.
 */
export function MatchdayScreen({ state, standings, lastResults, onAdvance, error }: Props) {
  const clubName = (clubId: string) => state.clubs[clubId]?.shortName ?? clubId;
  const upcoming = state.fixtures.filter((f) => f.matchday === state.season.currentMatchday);
  const seasonComplete = state.season.status === 'complete';

  const ownResult = lastResults.find(
    (r) => r.homeClubId === state.playerClubId || r.awayClubId === state.playerClubId,
  );

  return (
    <div>
      {error && <div className="error" data-testid="matchday-error">{error}</div>}

      <section className="panel">
        <div className="row-between">
          <h3 style={{ margin: 0 }}>
            {seasonComplete
              ? 'จบฤดูกาลแล้ว'
              : `นัดที่ ${state.season.currentMatchday} / ${state.season.totalMatchdays}`}
          </h3>
          <button
            className="primary"
            onClick={onAdvance}
            disabled={seasonComplete}
            data-testid="advance-matchday"
          >
            แข่งนัดถัดไป
          </button>
        </div>
        {seasonComplete && (
          <div className="notice" style={{ marginTop: 12, marginBottom: 0 }}>
            ฤดูกาลจบแล้ว — ระบบเลื่อนชั้น/ตกชั้นและการเริ่มฤดูกาลใหม่อยู่ในขอบเขต Slice 2
            ซึ่งยังไม่ได้พัฒนาในรอบนี้
          </div>
        )}
      </section>

      {!seasonComplete && (
        <section className="panel">
          <h4>โปรแกรมนัดนี้</h4>
          {upcoming.map((fixture) => {
            const isOwn =
              fixture.homeClubId === state.playerClubId || fixture.awayClubId === state.playerClubId;
            return (
              <div className={`resultrow ${isOwn ? 'you' : ''}`} key={fixture.id}>
                <span>{clubName(fixture.homeClubId)}</span>
                <span className="muted">พบ</span>
                <span>{clubName(fixture.awayClubId)}</span>
              </div>
            );
          })}
        </section>
      )}

      {ownResult && (
        <section className="panel" data-testid="own-result">
          <h3>ผลการแข่งขันของสโมสรคุณ</h3>
          <div className="resultrow you">
            <span>{clubName(ownResult.homeClubId)}</span>
            <span className="score" data-testid="own-score">
              {ownResult.homeGoals} - {ownResult.awayGoals}
            </span>
            <span>{clubName(ownResult.awayClubId)}</span>
          </div>
          <div className="rationale" style={{ marginTop: 12 }}>
            <small>บันทึกจากผู้จัดการทีมของคุณ (อ่านอย่างเดียว)</small>
            {ownResult.homeClubId === state.playerClubId
              ? ownResult.homeManagerRationale
              : ownResult.awayManagerRationale}
          </div>
        </section>
      )}

      {lastResults.length > 0 && (
        <section className="panel" data-testid="last-results">
          <h4>ผลการแข่งขันนัดที่ {state.lastMatchday}</h4>
          {lastResults.map((result) => (
            <div className="resultrow" key={result.matchId}>
              <span>{clubName(result.homeClubId)}</span>
              <span className="score">
                {result.homeGoals} - {result.awayGoals}
              </span>
              <span>{clubName(result.awayClubId)}</span>
            </div>
          ))}
        </section>
      )}

      <section className="panel">
        <h3>ตารางคะแนน</h3>
        <LeagueTable
          standings={standings}
          clubName={clubName}
          highlightClubId={state.playerClubId}
        />
      </section>
    </div>
  );
}
