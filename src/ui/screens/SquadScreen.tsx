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

const CATEGORY_LABEL: Record<string, string> = {
  thai: 'ไทย',
  asean: 'อาเซียน',
  asian: 'เอเชีย',
  other: 'ต่างชาติ',
  unknown: 'ไม่ทราบ',
};

/**
 * Presentation only: lists the squad the squad system already assembled.
 * No selection, no lineup, no drag-to-reorder — viewing only (brief PLAYER
 * ROLE forbids the chairman touching team selection).
 *
 * Where a squad came from an approved research document, this screen makes
 * the provenance visible: real names are marked, and the fact that ratings
 * are simulated game values rather than researched facts is stated plainly.
 */
export function SquadScreen({ squad, trainingFacilityLevel }: Props) {
  const sorted = [...squad].sort(
    (a, b) => POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position) || b.ability - a.ability,
  );

  const researched = squad.filter((p) => p.verification !== 'FICTIONAL');
  const conflicted = squad.filter((p) => p.verification === 'CONFLICTED');
  const source = researched[0]?.source;

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

      {researched.length > 0 && (
        <div className="notice" data-testid="provenance-notice">
          <b>รายชื่อนักเตะชุดนี้เป็นชื่อจริง</b> นำเข้าจากเอกสาร research ที่ได้รับอนุมัติ
          {source ? ` (${source})` : ''}
          <br />
          แต่ <b>ค่าความสามารถ อายุ และค่าเหนื่อยเป็นค่าจำลองสำหรับเกมเท่านั้น</b>{' '}
          ไม่ใช่ข้อมูลจริงของนักเตะ และไม่ได้อ้างอิงจากแหล่งใด
          {conflicted.length > 0 && (
            <>
              <br />
              มี {conflicted.length} รายการที่เอกสารต้นทางระบุให้ตรวจสอบเพิ่มเติม (ติดป้าย CONFLICTED)
            </>
          )}
        </div>
      )}

      <section className="panel">
        <div className="tablewrap">
          <table data-testid="squad-table">
            <thead>
              <tr>
                <th>#</th>
                <th style={{ textAlign: 'left' }}>ชื่อ</th>
                <th>ตำแหน่ง</th>
                <th>อายุ*</th>
                <th>ความสามารถ*</th>
                <th>สัญชาติ</th>
                <th>ค่าเหนื่อย/สัปดาห์*</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((player) => (
                <tr key={player.id} data-testid={`player-${player.id}`}>
                  <td>{player.squadNumber ?? '—'}</td>
                  <td style={{ textAlign: 'left' }}>
                    {player.name}
                    {player.verification === 'CONFLICTED' && (
                      <span className="badge warn" style={{ marginLeft: 6 }}>CONFLICTED</span>
                    )}
                  </td>
                  <td>{POSITION_LABEL[player.position]}</td>
                  <td>{player.age}</td>
                  <td><b>{player.ability}</b></td>
                  <td>
                    {player.nationality}
                    {player.nationalityCategory !== 'thai' && (
                      <span className="badge" style={{ marginLeft: 6 }}>
                        {CATEGORY_LABEL[player.nationalityCategory]}
                      </span>
                    )}
                  </td>
                  <td>{formatBaht(player.wage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="footnote" style={{ textAlign: 'left', marginTop: 12 }}>
          * ค่าจำลองสำหรับเกม ไม่ใช่ข้อมูลจริงของนักเตะ
        </div>
      </section>
    </div>
  );
}
