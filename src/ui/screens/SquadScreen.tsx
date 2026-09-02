import type { Player, Position } from '../../core/player';
import { formatBaht } from '../../core/money';

interface Props {
  squad: Player[];
  trainingFacilityLevel: number;
}

const POSITION_LABEL: Record<Position, string> = {
  GK: 'ผู้รักษาประตู',
  DF: 'กองหลัง',
  MF: 'กองกลาง',
  FW: 'กองหน้า',
};

const POSITION_ORDER: Position[] = ['GK', 'DF', 'MF', 'FW'];

/**
 * Presentation only: lists the squad the squad system already assembled.
 * No selection, no lineup, no drag-to-reorder — viewing only (brief PLAYER
 * ROLE forbids the chairman touching team selection).
 */
export function SquadScreen({ squad, trainingFacilityLevel }: Props) {
  const sorted = [...squad].sort(
    (a, b) => POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position) || b.ability - a.ability,
  );

  return (
    <div>
      <section className="panel">
        <div className="row-between">
          <h3 style={{ margin: 0 }}>นักเตะในทีม ({squad.length})</h3>
          <span className="badge">สนามฝึกซ้อมระดับ {trainingFacilityLevel}</span>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          รายชื่อนี้ดูได้อย่างเดียว — ผู้จัดการทีมเป็นผู้เลือกตัวจริงและแทคติกเองทั้งหมด
        </p>
      </section>

      <section className="panel">
        <div className="tablewrap">
          <table data-testid="squad-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>ชื่อ</th>
                <th>ตำแหน่ง</th>
                <th>อายุ</th>
                <th>ความสามารถ</th>
                <th>สัญชาติ</th>
                <th>ค่าเหนื่อย/สัปดาห์</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((player) => (
                <tr key={player.id} data-testid={`player-${player.id}`}>
                  <td style={{ textAlign: 'left' }}>{player.name}</td>
                  <td>{POSITION_LABEL[player.position]}</td>
                  <td>{player.age}</td>
                  <td><b>{player.ability}</b></td>
                  <td>
                    {player.nationality}
                    {player.isForeign && <span className="badge" style={{ marginLeft: 6 }}>ต่างชาติ</span>}
                  </td>
                  <td>{formatBaht(player.wage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
