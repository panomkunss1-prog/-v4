import type { GameDate } from '../core/gameDate';
import type { InboxItem } from '../core/inboxItem';
import { err, ok, type Result } from '../core/result';
import { dateForMatchday } from '../systems/calendar/seasonCalendar';
import { scheduledEventsForMatchday } from '../systems/calendar/events';
import { matchesForMatchday } from '../systems/league/fixtures';
import { advanceMatchday } from './advanceMatchday';
import type { GameState } from './gameState';
import { resultsForMatchday } from './gameState';

/**
 * ============================================================================
 * THE NEXT / TIME-PROGRESSION ORCHESTRATOR
 * ============================================================================
 * This is the ONLY place "NEXT" is implemented, and every NEXT control in the
 * UI (Home, the Matchday screen) calls this one function — never
 * advanceMatchday directly — so there is exactly one code path for "what
 * happens when time moves forward."
 *
 * What it does NOT do, by construction:
 *   - it never imports simulateMatch or computeStandings
 *   - it never constructs a MatchResult
 *   - it never mutates League state itself
 * All of that stays inside the existing, untouched systems/match and
 * systems/league modules, reached ONLY via the existing advanceMatchday()
 * call below. This file is enforced by
 * tests/architecture/noParallelTimeProgression.test.ts, which fails the
 * build if a forbidden import ever appears here.
 *
 * Because the engine's only tick granularity is a matchday (there is no
 * sub-matchday "empty day" concept anywhere in the data model), one NEXT
 * press always advances straight to the next meaningful event — the next
 * matchday, and whatever scheduled executive note lands on the same date —
 * never a string of do-nothing days requiring repeated clicks.
 */
export function advanceGameClock(state: GameState): Result<GameState> {
  if (state.season.status === 'complete') {
    return err('ฤดูกาลจบแล้ว — ไปที่หน้าสรุปฤดูกาลเพื่อเริ่มฤดูกาลถัดไป');
  }

  const matchday = state.season.currentMatchday;
  const date = dateForMatchday(state.year, matchday);

  const scheduled: InboxItem[] = scheduledEventsForMatchday(
    matchday,
    state.season.totalMatchdays,
  ).map((template, i) => ({
    id: `${state.season.id}-MD${matchday}-EV${i}`,
    date,
    category: template.category,
    title: template.title,
    body: template.body,
    read: false,
  }));

  // The ONLY call into match/league logic. Everything about who played whom,
  // what the score was, and how the table moved is decided in there.
  const result = advanceMatchday(state);
  if (!result.ok) return err(result.error);
  const next = result.value;

  const ownResult = resultsForMatchday(next, matchday).find(
    (r) => r.homeClubId === next.playerClubId || r.awayClubId === next.playerClubId,
  );

  const matchNews: InboxItem[] = [];
  if (ownResult) {
    const isHome = ownResult.homeClubId === next.playerClubId;
    const opponentId = isHome ? ownResult.awayClubId : ownResult.homeClubId;
    const opponentName = next.clubs[opponentId]?.shortName ?? opponentId;
    const ownGoals = isHome ? ownResult.homeGoals : ownResult.awayGoals;
    const oppGoals = isHome ? ownResult.awayGoals : ownResult.homeGoals;
    const resultWord = ownGoals > oppGoals ? 'ชนะ' : ownGoals < oppGoals ? 'แพ้' : 'เสมอ';
    const rationale = isHome ? ownResult.homeManagerRationale : ownResult.awayManagerRationale;

    matchNews.push({
      id: `${state.season.id}-MD${matchday}-RESULT`,
      date,
      category: 'match',
      title: `${resultWord} ${ownGoals}-${oppGoals} ${isHome ? 'พบ' : 'เยือน'} ${opponentName}`,
      body: rationale,
      read: false,
    });
  }

  return ok({
    ...next,
    currentDate: date,
    inbox: [...state.inbox, ...scheduled, ...matchNews],
  });
}

export function markInboxRead(state: GameState, itemId: string): GameState {
  return {
    ...state,
    inbox: state.inbox.map((item) => (item.id === itemId ? { ...item, read: true } : item)),
  };
}

/** Read-only preview of what NEXT will do, for Home to display before it happens. */
export interface UpcomingPreview {
  matchday: number;
  totalMatchdays: number;
  date: GameDate;
  opponentClubId: string | null;
  opponentName: string | null;
  isHome: boolean;
  eventTitles: string[];
}

export function previewUpcoming(state: GameState): UpcomingPreview | null {
  if (state.season.status === 'complete') return null;

  const matchday = state.season.currentMatchday;
  const date = dateForMatchday(state.year, matchday);
  const fixture = matchesForMatchday(state.fixtures, matchday).find(
    (f) => f.homeClubId === state.playerClubId || f.awayClubId === state.playerClubId,
  );
  const isHome = fixture?.homeClubId === state.playerClubId;
  const opponentClubId = fixture
    ? isHome
      ? fixture.awayClubId
      : fixture.homeClubId
    : null;

  return {
    matchday,
    totalMatchdays: state.season.totalMatchdays,
    date,
    opponentClubId,
    opponentName: opponentClubId ? (state.clubs[opponentClubId]?.shortName ?? opponentClubId) : null,
    isHome,
    eventTitles: scheduledEventsForMatchday(matchday, state.season.totalMatchdays).map(
      (e) => e.title,
    ),
  };
}
