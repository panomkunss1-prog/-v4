import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChairmanProfile } from '../core/chairman';
import type { DecisionParams, DecisionType } from '../core/decision';
import type { GameState } from '../app/gameState';
import { resultsForMatchday } from '../app/gameState';
import { createCareer } from '../app/newCareer';
import { applyDecision } from '../app/applyDecision';
import { advanceGameClock, markInboxRead, previewUpcoming } from '../app/gameClock';
import { currentStandings } from '../app/standingsQuery';
import { clubOverview } from '../app/clubOverview';
import { clearCareer, loadCareer, saveCareer } from '../app/saveLoad';
import { StartScreen } from './screens/StartScreen';
import { ChairmanCreationScreen } from './screens/ChairmanCreationScreen';
import { ClubSelectionScreen } from './screens/ClubSelectionScreen';
import { HomeScreen } from './screens/HomeScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { DecisionsScreen } from './screens/DecisionsScreen';
import { MatchdayScreen } from './screens/MatchdayScreen';
import { SquadScreen } from './screens/SquadScreen';
import { FacilitiesScreen } from './screens/FacilitiesScreen';
import { SponsorsScreen } from './screens/SponsorsScreen';
import { SeasonEndScreen } from './screens/SeasonEndScreen';
import { endSeason, startNextSeason, type SeasonOutcome } from '../app/endSeason';

type Screen =
  | 'start'
  | 'chairman'
  | 'club'
  | 'home'
  | 'dashboard'
  | 'squad'
  | 'facilities'
  | 'sponsors'
  | 'decisions'
  | 'matchday'
  | 'seasonEnd';

/**
 * UI shell. It holds a reference to the one GameState owned by the app layer
 * and re-renders when the app hands back a new one. It never mutates game
 * state itself and never computes a business rule (brief ARCHITECTURE).
 */
export function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [state, setState] = useState<GameState | null>(null);
  const [draftChairman, setDraftChairman] = useState<ChairmanProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sponsorError, setSponsorError] = useState<string | null>(null);
  const [seasonOutcome, setSeasonOutcome] = useState<SeasonOutcome | null>(null);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    setHasSave(loadCareer() !== null);
  }, []);

  // Persistence is an app-layer concern; the UI only signals when to save.
  useEffect(() => {
    if (state) saveCareer(state);
  }, [state]);

  const standings = useMemo(() => (state ? currentStandings(state) : []), [state]);
  const overview = useMemo(() => (state ? clubOverview(state) : null), [state]);
  const upcoming = useMemo(() => (state ? previewUpcoming(state) : null), [state]);
  const lastResults = useMemo(
    () => (state && state.lastMatchday ? resultsForMatchday(state, state.lastMatchday) : []),
    [state],
  );

  const handleDecision = useCallback(
    (type: DecisionType, amount: number): string | null => {
      if (!state) return 'ยังไม่ได้เริ่มอาชีพ';
      const params =
        type === 'budget_allocation' ? { transferBudget: amount } : { investment: amount };
      const result = applyDecision(state, type, params);
      if (!result.ok) return result.error;
      setState(result.value);
      return null;
    },
    [state],
  );

  const handleDecisionParams = useCallback(
    (type: DecisionType, params: DecisionParams): string | null => {
      if (!state) return 'ยังไม่ได้เริ่มอาชีพ';
      const result = applyDecision(state, type, params);
      if (!result.ok) return result.error;
      setState(result.value);
      return null;
    },
    [state],
  );

  const handleSignSponsor = useCallback(
    (offerId: string): string | null => {
      const err = handleDecisionParams('sign_sponsor', { sponsorOfferId: offerId });
      setSponsorError(err);
      return err;
    },
    [handleDecisionParams],
  );

  // The ONE NEXT handler. Home's NEXT button and the Matchday screen's
  // "advance" button both call this, so there is exactly one code path for
  // time progression — it always goes through app/gameClock.ts, which
  // delegates match/league simulation to the existing advanceMatchday().
  const handleAdvance = useCallback(() => {
    if (!state) return;
    const result = advanceGameClock(state);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setState(result.value);
  }, [state]);

  const handleOpenInboxItem = useCallback(
    (itemId: string) => {
      if (!state) return;
      setState(markInboxRead(state, itemId));
    },
    [state],
  );

  const handleReviewSeason = useCallback(() => {
    if (!state) return;
    const result = endSeason(state);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setSeasonOutcome(result.value);
    setScreen('seasonEnd');
  }, [state]);

  const handleStartNextSeason = useCallback(() => {
    if (!state || !seasonOutcome) return;
    const result = startNextSeason(state, seasonOutcome);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSeasonOutcome(null);
    setState(result.value);
    setScreen('home');
  }, [state, seasonOutcome]);

  if (screen === 'start' || !state) {
    return (
      <main className="app">
        {screen === 'chairman' ? (
          <ChairmanCreationScreen
            onCreated={(profile) => {
              setDraftChairman(profile);
              setScreen('club');
            }}
            onBack={() => setScreen('start')}
          />
        ) : screen === 'club' && draftChairman ? (
          <ClubSelectionScreen
            chairmanName={draftChairman.name}
            onSelected={(clubId) => {
              setState(createCareer(draftChairman, clubId));
              setScreen('home');
            }}
            onBack={() => setScreen('chairman')}
          />
        ) : (
          <StartScreen
            hasSave={hasSave}
            onNewCareer={() => {
              clearCareer();
              setDraftChairman(null);
              setScreen('chairman');
            }}
            onContinue={() => {
              const saved = loadCareer();
              if (saved) {
                setState(saved);
                setScreen('home');
              }
            }}
          />
        )}
      </main>
    );
  }

  if (screen === 'seasonEnd' && seasonOutcome) {
    return (
      <main className="app">
        <SeasonEndScreen
          state={state}
          outcome={seasonOutcome}
          onContinue={handleStartNextSeason}
        />
      </main>
    );
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <div className="title" data-testid="header-club">
            {state.clubs[state.playerClubId]?.shortName ?? ''}
          </div>
          <div className="sub">
            ประธาน {state.chairman.name} · {state.season.competitionId}
            {state.season.zone ? ` โซน${state.season.zone}` : ''} · ปี {state.year}
            {state.history.length > 0 ? ` · ฤดูกาลที่ ${state.history.length + 1}` : ''}
          </div>
        </div>
      </header>

      <nav className="navbar">
        <button
          className={screen === 'home' ? 'active' : ''}
          onClick={() => setScreen('home')}
          data-testid="nav-home"
        >
          หน้าแรก
        </button>
        <button
          className={screen === 'dashboard' ? 'active' : ''}
          onClick={() => setScreen('dashboard')}
          data-testid="nav-dashboard"
        >
          ภาพรวมสโมสร
        </button>
        <button
          className={screen === 'squad' ? 'active' : ''}
          onClick={() => setScreen('squad')}
          data-testid="nav-squad"
        >
          นักเตะ
        </button>
        <button
          className={screen === 'facilities' ? 'active' : ''}
          onClick={() => setScreen('facilities')}
          data-testid="nav-facilities"
        >
          สนาม
        </button>
        <button
          className={screen === 'sponsors' ? 'active' : ''}
          onClick={() => setScreen('sponsors')}
          data-testid="nav-sponsors"
        >
          สปอนเซอร์
        </button>
        <button
          className={screen === 'decisions' ? 'active' : ''}
          onClick={() => setScreen('decisions')}
          data-testid="nav-decisions"
        >
          การตัดสินใจ
        </button>
        <button
          className={screen === 'matchday' ? 'active' : ''}
          onClick={() => setScreen('matchday')}
          data-testid="nav-matchday"
        >
          แข่งขัน / ตารางคะแนน
        </button>
      </nav>

      {screen === 'home' && overview && (
        <HomeScreen
          state={state}
          overview={overview}
          upcoming={upcoming}
          onNext={handleAdvance}
          onReviewSeason={handleReviewSeason}
          onOpenInboxItem={handleOpenInboxItem}
          error={error}
        />
      )}
      {screen === 'dashboard' && overview && (
        <DashboardScreen state={state} overview={overview} />
      )}
      {screen === 'squad' && overview && (
        <SquadScreen
          squad={overview.squad}
          trainingFacilityLevel={state.clubs[state.playerClubId]?.trainingFacilityLevel ?? 1}
          importStatus={overview.squadImportStatus}
          statusNote={overview.squadStatusNote}
          documentedConflicts={overview.documentedConflicts}
        />
      )}
      {screen === 'facilities' && (
        <FacilitiesScreen state={state} onDecide={handleDecisionParams} />
      )}
      {screen === 'sponsors' && (
        <SponsorsScreen state={state} onSign={handleSignSponsor} error={sponsorError} />
      )}
      {screen === 'decisions' && <DecisionsScreen state={state} onDecide={handleDecision} />}
      {screen === 'matchday' && (
        <MatchdayScreen
          state={state}
          standings={standings}
          lastResults={lastResults}
          onAdvance={handleAdvance}
          onReviewSeason={handleReviewSeason}
          error={error}
        />
      )}

      <div className="footnote">
        Prototype — ข้อมูลสโมสร นักเตะ และผู้จัดการทีมทั้งหมดเป็นข้อมูลสมมติ
        <br />
        ผู้เล่นรับบทประธานสโมสรเท่านั้น · ผู้จัดการทีมเป็น NPC
      </div>
    </main>
  );
}
