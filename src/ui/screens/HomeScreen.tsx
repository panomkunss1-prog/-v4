import type { GameState } from '../../app/gameState';
import type { ClubOverview } from '../../app/clubOverview';
import type { UpcomingPreview } from '../../app/gameClock';
import type { InboxItem, InboxCategory } from '../../core/inboxItem';
import { formatGameDate } from '../../core/gameDate';
import { formatBaht } from '../../core/money';
import { Stat } from '../components/Stat';

interface Props {
  state: GameState;
  overview: ClubOverview;
  upcoming: UpcomingPreview | null;
  onNext: () => void;
  onReviewSeason: () => void;
  onOpenInboxItem: (id: string) => void;
  error: string | null;
}

const CATEGORY_LABEL: Record<InboxCategory, string> = {
  season: 'ฤดูกาล',
  board: 'บอร์ด',
  finance: 'การเงิน',
  sponsor: 'สปอนเซอร์',
  match: 'ผลการแข่งขัน',
  squad: 'ทีม',
};

const CATEGORY_BADGE: Record<InboxCategory, string> = {
  season: '',
  board: 'warn',
  finance: 'warn',
  sponsor: 'ok',
  match: 'ok',
  squad: '',
};

function inboxRow(item: InboxItem, onOpen: (id: string) => void) {
  return (
    <button
      key={item.id}
      className="option"
      style={{ width: '100%', textAlign: 'left', marginBottom: 8 }}
      onClick={() => onOpen(item.id)}
      data-testid={`inbox-item-${item.id}`}
    >
      <div className="row-between">
        <span>
          {!item.read && <span className="badge bad" style={{ marginRight: 6 }}>ใหม่</span>}
          <span className={`badge ${CATEGORY_BADGE[item.category]}`} style={{ marginRight: 6 }}>
            {CATEGORY_LABEL[item.category]}
          </span>
          <b>{item.title}</b>
        </span>
        <span className="muted">{formatGameDate(item.date)}</span>
      </div>
      <small style={{ display: 'block', marginTop: 4, fontWeight: 400 }}>{item.body}</small>
    </button>
  );
}

/**
 * The main gameplay screen: the football-executive "home" the chairman
 * returns to after every action. Time only moves when NEXT is pressed, and
 * NEXT is the only thing on this screen that changes League/Match state —
 * routed entirely through app/gameClock.ts, which delegates to the existing
 * advanceMatchday(). This screen computes nothing itself; every value here
 * is data already produced by the app layer.
 */
export function HomeScreen({
  state,
  overview,
  upcoming,
  onNext,
  onReviewSeason,
  onOpenInboxItem,
  error,
}: Props) {
  const unread = state.inbox.filter((i) => !i.read);
  const recentInbox = [...state.inbox].reverse().slice(0, 5);
  const seasonComplete = state.season.status === 'complete';

  return (
    <div>
      <section className="panel" data-testid="home-clock">
        <div className="row-between">
          <div>
            <div className="title" style={{ fontSize: 22 }} data-testid="current-date">
              {formatGameDate(state.currentDate)}
            </div>
            <div className="sub">
              {state.season.competitionId}
              {state.season.zone ? ` โซน${state.season.zone}` : ''} · ปี {state.year}
              {state.history.length > 0 ? ` · ฤดูกาลที่ ${state.history.length + 1}` : ''} · นัดที่{' '}
              {Math.min(state.season.currentMatchday, state.season.totalMatchdays)}/
              {state.season.totalMatchdays}
            </div>
          </div>
          {seasonComplete ? (
            <button className="primary" onClick={onReviewSeason} data-testid="home-review-season">
              ดูสรุปฤดูกาล
            </button>
          ) : (
            <button className="primary" onClick={onNext} data-testid="home-next">
              ถัดไป
            </button>
          )}
        </div>
      </section>

      {error && <div className="error" data-testid="home-error">{error}</div>}

      <section className="stats">
        <Stat label="สโมสร" value={overview.club.shortName} />
        <Stat label="เงินคงเหลือ" value={formatBaht(state.finance.balance)} testId="home-balance" />
        <Stat
          label="อันดับลีก"
          value={overview.leaguePosition > 0 ? `#${overview.leaguePosition}` : '—'}
          testId="home-position"
        />
        <Stat label="ความเชื่อมั่นบอร์ด" value={`${state.board.confidence}`} testId="home-confidence" />
      </section>

      {!seasonComplete && upcoming && (
        <section className="panel" data-testid="home-upcoming">
          <h3>นัดถัดไป</h3>
          <div className="resultrow you">
            <span>{overview.club.shortName}</span>
            <span className="muted">{upcoming.isHome ? 'เหย้า' : 'เยือน'}</span>
            <span>{upcoming.opponentName ?? 'รอจับคู่'}</span>
          </div>
          <div className="muted" style={{ marginTop: 8 }}>
            นัดที่ {upcoming.matchday}/{upcoming.totalMatchdays} · {formatGameDate(upcoming.date)}
          </div>
          {upcoming.eventTitles.length > 0 && (
            <div className="notice" style={{ marginTop: 10, marginBottom: 0 }}>
              เหตุการณ์วันนั้น: {upcoming.eventTitles.join(' · ')}
            </div>
          )}
        </section>
      )}

      <section className="panel">
        <div className="row-between">
          <h3 style={{ margin: 0 }}>กล่องข้อความ{unread.length > 0 ? ` (${unread.length} ใหม่)` : ''}</h3>
        </div>
        {recentInbox.length === 0 ? (
          <p className="muted" style={{ marginTop: 10 }}>
            ยังไม่มีข้อความ — กด "ถัดไป" เพื่อเริ่มดำเนินฤดูกาล
          </p>
        ) : (
          <div style={{ marginTop: 10 }} data-testid="home-inbox">
            {recentInbox.map((item) => inboxRow(item, onOpenInboxItem))}
          </div>
        )}
      </section>

      <div className="footnote">
        วันที่ในเกมเป็นปฏิทินจำลองสำหรับการเล่น ไม่ใช่ตารางแข่งขันจริงที่ประกาศโดยหน่วยงานใด
      </div>
    </div>
  );
}
