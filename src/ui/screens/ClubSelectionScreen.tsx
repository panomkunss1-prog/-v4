import { useState } from 'react';
import type { Club } from '../../core/club';
import { formatBahtCompact } from '../../core/money';
import { COMPETITIONS } from '../../data/competitions.data';
import { clubsForCompetition, ROSTER_VERIFIED } from '../../data/clubs.seed';
import { getRegulation } from '../../data/regulations.data';

interface Props {
  chairmanName: string;
  onSelected: (clubId: string) => void;
  onBack: () => void;
}

type CompetitionId = 'T1' | 'T2' | 'T3';

export function ClubSelectionScreen({ chairmanName, onSelected, onBack }: Props) {
  const [competitionId, setCompetitionId] = useState<CompetitionId>('T1');
  const [selected, setSelected] = useState<string | null>(null);

  const regulation = getRegulation(competitionId);
  const clubs: Club[] = clubsForCompetition(competitionId);
  const rosterVerified = ROSTER_VERIFIED[competitionId];

  return (
    <div>
      <header className="header">
        <div>
          <div className="title">เลือกสโมสร</div>
          <div className="sub">ประธาน {chairmanName} — เลือกสโมสรที่จะเข้าบริหาร</div>
        </div>
        <button className="ghost" onClick={onBack}>ย้อนกลับ</button>
      </header>

      <section className="panel">
        <h3>ลีก</h3>
        <div className="optiongrid">
          {COMPETITIONS.map((c) => (
            <button
              key={c.id}
              className={`option ${competitionId === c.id ? 'selected' : ''}`}
              onClick={() => {
                setCompetitionId(c.id as CompetitionId);
                setSelected(null);
              }}
              data-testid={`competition-${c.id}`}
            >
              {c.name}
              <small>
                {c.expectedClubCount} สโมสร
                {c.zones.length > 0 ? ` · ${c.zones.length} โซน` : ''}
              </small>
            </button>
          ))}
        </div>
        <div className="muted" style={{ marginTop: 10 }}>
          โควตาผู้เล่นต่างชาติที่ลงทะเบียนได้: {regulation.foreignRegistrationMax.value} คน
          {regulation.foreignRegistrationMax.verification !== 'VERIFIED' && (
            <span className="badge warn" style={{ marginLeft: 6 }}>
              NEEDS_VERIFICATION
            </span>
          )}
        </div>
      </section>

      {!rosterVerified && (
        <div className="notice" data-testid="roster-unverified">
          รายชื่อสโมสรใน{COMPETITIONS.find((c) => c.id === competitionId)?.name}
          สร้างจากชื่อจังหวัด/อำเภอจริงตามรูปแบบการตั้งชื่อสโมสรไทยลีกที่ใช้จริง
          แต่ยังไม่ได้ตรวจสอบทีละทีมว่าตรงกับรายชื่อสโมสรจริงในฤดูกาลนี้ —
          ถือเป็น NEEDS_VERIFICATION เช่นเดียวกับกฎการแข่งขันที่ยังไม่ยืนยัน
        </div>
      )}

      <section className="panel">
        <h3>สโมสร ({clubs.length})</h3>
        <div className="optiongrid">
          {clubs.map((club) => (
            <button
              key={club.id}
              className={`option ${selected === club.id ? 'selected' : ''}`}
              onClick={() => setSelected(club.id)}
              data-testid={`club-${club.id}`}
            >
              {club.shortName}
              <small>
                {club.stadiumName} · ชื่อเสียง {club.reputation} ·{' '}
                {formatBahtCompact(club.startingBalance)}
              </small>
            </button>
          ))}
        </div>
      </section>

      <button
        className="primary"
        style={{ width: '100%' }}
        disabled={!selected}
        data-testid="confirm-club"
        onClick={() => selected && onSelected(selected)}
      >
        เริ่มบริหารสโมสรนี้
      </button>
    </div>
  );
}
