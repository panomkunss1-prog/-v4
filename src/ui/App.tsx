import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChairmanProfile } from '../core/chairman';
import type { DecisionType } from '../core/decision';
import type { GameState } from '../app/gameState';
import { resultsForMatchday } from '../app/gameState';
import { createCareer } from '../app/newCareer';
import { applyDecision } from '../app/applyDecision';
import { advanceMatchday } from '../app/advanceMatchday';
import { currentStandings } from '../app/standingsQuery';
import { clubOverview } from '../app/clubOverview';
import { clearCareer, loadCareer, saveCareer } from '../app/saveLoad';
import { StartScreen } from './screens/StartScreen';
import { ChairmanCreationScreen } from './screens/ChairmanCreationScreen';
import { ClubSelectionScreen } from './screens/ClubSelectionScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { DecisionsScreen } from './screens/DecisionsScreen';
import { MatchdayScreen } from './screens/MatchdayScreen';

type Screen = 'start' | 'chairman' | 'club' | 'dashboard' | 'decisions' | 'matchday';

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

  const handleAdvance = useCallback(() => {
    if (!state) return;
    const result = advanceMatchday(state);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setState(result.value);
  }, [state]);

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
              setScreen('dashboard');
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
                setScreen('dashboard');
              }
            }}
          />
        )}
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
            ประธาน {state.chairman.name} · {state.season.competitionId} ปี {state.year}
          </div>
        </div>
      </header>

      <nav className="navbar">
        <button
          className={screen === 'dashboard' ? 'active' : ''}
          onClick={() => setScreen('dashboard')}
          data-testid="nav-dashboard"
        >
          ภาพรวมสโมสร
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

      {screen === 'dashboard' && overview && (
        <DashboardScreen state={state} overview={overview} />
      )}
      {screen === 'decisions' && <DecisionsScreen state={state} onDecide={handleDecision} />}
      {screen === 'matchday' && (
        <MatchdayScreen
          state={state}
          standings={standings}
          lastResults={lastResults}
          onAdvance={handleAdvance}
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
