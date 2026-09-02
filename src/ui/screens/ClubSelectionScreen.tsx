import { useState } from 'react';
import type { Club } from '../../core/club';
import { formatBahtCompact } from '../../core/money';
import { COMPETITIONS } from '../../data/competitions.data';
import { clubsForCompetition } from '../../data/clubs.seed';
import { getRegulation } from '../../data/regulations.data';

interface Props {
  chairmanName: string;
  onSelected: (clubId: string) => void;
  onBack: () => void;
}

export function ClubSelectionScreen({ chairmanName, onSelected, onBack }: Props) {
  // Slice 1 models the player's own competition only; T2/T3 arrive in Slice 2.
  const [competitionId, setCompetitionId] = useState('T1');
  const [selected, setSelected] = useState<string | null>(null);

  const competition = COMPETITIONS.find((c) => c.id === competitionId);
  const regulation = getRegulation(competitionId);
  const clubs: Club[] = clubsForCompetition(competitionId);
  const supported = competitionId === 'T1';

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
                setCompetitionId(c.id);
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

      {!supported && (
        <div className="notice" data-testid="tier-unsupported">
          Slice 1 รองรับเฉพาะ {competition?.name ? 'ไทยลีก 1' : 'ไทยลีก 1'} เท่านั้น
          โครงสร้างของ {competition?.name} มีอยู่ในข้อมูลแล้ว แต่การจำลองฤดูกาลของลีกนี้
          อยู่ในขอบเขต Slice 2 (เลื่อนชั้น/ตกชั้น)
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
              disabled={!supported}
            >
              {club.shortName}
              <small>
                ชื่อเสียง {club.reputation} · อะคาเดมี {club.academy} ·{' '}
                {formatBahtCompact(club.startingBalance)}
              </small>
            </button>
          ))}
        </div>
      </section>

      <button
        className="primary"
        style={{ width: '100%' }}
        disabled={!selected || !supported}
        data-testid="confirm-club"
        onClick={() => selected && onSelected(selected)}
      >
        เริ่มบริหารสโมสรนี้
      </button>
    </div>
  );
}
