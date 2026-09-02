import type { ConsequenceEffect } from '../../core/decision';

const SYSTEM_LABEL: Record<ConsequenceEffect['system'], string> = {
  finance: 'การเงิน',
  board: 'บอร์ด',
  fans: 'แฟนบอล',
  manager: 'ผู้จัดการทีม',
  club: 'สโมสร',
};

/** Renders before/after movements produced by the executive system. */
export function ConsequenceList({ effects }: { effects: ConsequenceEffect[] }) {
  return (
    <div data-testid="consequences">
      {effects.map((effect, i) => {
        const delta = effect.after - effect.before;
        const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
        const sign = delta > 0 ? '+' : '';
        return (
          <div className="effect" key={`${effect.label}-${i}`}>
            <span>
              <span className="muted">{SYSTEM_LABEL[effect.system]} · </span>
              {effect.label}
            </span>
            <span>
              <span className="muted">
                {effect.before.toLocaleString('th-TH')} → {effect.after.toLocaleString('th-TH')}{' '}
              </span>
              <span className={`delta ${direction}`}>
                ({sign}
                {delta.toLocaleString('th-TH')})
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
