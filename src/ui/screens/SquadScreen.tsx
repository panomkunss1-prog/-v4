import type { Player, Position } from '../../core/player';
import { formatBaht } from '../../core/money';

interface Props {
  squad: Player[];
  trainingFacilityLevel: number;
  importStatus: 'TIER1' | 'PROVISIONAL' | null;
  statusNote: string | null;
  documentedConflicts: string[];
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
export function SquadScreen({
  squad,
  trainingFacilityLevel,
  importStatus,
  statusNote,
  documentedConflicts,
}: Props) {
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
          <div style={{ marginBottom: 6 }}>
            <b>รายชื่อนักเตะชุดนี้เป็นชื่อจริง</b> นำเข้าจากเอกสาร research ที่ได้รับอนุมัติ
            <span
              className={`badge ${importStatus === 'TIER1' ? 'ok' : 'warn'}`}
              style={{ marginLeft: 6 }}
              data-testid="import-status"
            >
              {importStatus === 'TIER1' ? 'TIER 1' : 'PROVISIONAL'}
            </span>
          </div>
          {source && <div className="muted" style={{ marginBottom: 6 }}>แหล่งข้อมูล: {source}</div>}
          {statusNote && <div style={{ marginBottom: 6 }}>{statusNote}</div>}
          <div>
            <b>ค่าความสามารถ อายุ และค่าเหนื่อยเป็นค่าจำลองสำหรับเกมเท่านั้น</b>{' '}
            ไม่ใช่ข้อมูลจริงของนักเตะ และไม่ได้อ้างอิงจากแหล่งใด
          </div>
          {conflicted.length > 0 && (
            <div style={{ marginTop: 4 }}>
              มี {conflicted.length} รายการที่เอกสารต้นทางระบุให้ตรวจสอบเพิ่มเติม (ติดป้าย CONFLICTED)
            </div>
          )}
        </div>
      )}

      {documentedConflicts.length > 0 && (
        <section className="panel" data-testid="documented-conflicts">
          <h4>ข้อมูลที่เอกสารต้นทางระบุว่ายังไม่ยุติ ({documentedConflicts.length})</h4>
          {documentedConflicts.map((conflict, i) => (
            <div className="effect" key={i}>
              <span>{conflict}</span>
            </div>
          ))}
          <div className="muted" style={{ marginTop: 8 }}>
            ระบบไม่ตัดสินข้อขัดแย้งเหล่านี้เอง — เก็บสถานะไว้ตามที่เอกสารกำหนด
          </div>
        </section>
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
                  <td>
                    {POSITION_LABEL[player.position]}
                    {player.unsourcedFields.includes('position') && (
                      <span className="muted" title="ตำแหน่งไม่ได้ระบุในเอกสารต้นทาง — เป็นค่าจำลอง">*</span>
                    )}
                  </td>
                  <td>{player.age}</td>
                  <td><b>{player.ability}</b></td>
                  <td>
                    {player.nationality}
                    {player.unsourcedFields.includes('nationality') && (
                      <span className="muted" title="สัญชาติไม่ได้ระบุในเอกสารต้นทาง">*</span>
                    )}
                    {player.nationalityCategory !== 'thai' && player.nationalityCategory !== 'unknown' && (
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
          * ค่าจำลองสำหรับเกม ไม่ใช่ข้อมูลจริงของนักเตะ หรือเป็นข้อมูลที่เอกสารต้นทางไม่ได้ระบุไว้
        </div>
      </section>
    </div>
  );
}
