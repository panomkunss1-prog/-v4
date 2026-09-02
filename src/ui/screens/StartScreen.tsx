interface Props {
  hasSave: boolean;
  onNewCareer: () => void;
  onContinue: () => void;
}

export function StartScreen({ hasSave, onNewCareer, onContinue }: Props) {
  return (
    <div>
      <header className="header">
        <div>
          <div className="title">Thai Football Executive</div>
          <div className="sub">เกมบริหารสโมสรฟุตบอลไทย — คุณคือประธานสโมสร</div>
        </div>
      </header>

      <section className="panel">
        <h3>เริ่มต้นอาชีพ</h3>
        <p className="muted" style={{ lineHeight: 1.7 }}>
          คุณรับบทเป็น <b>ประธานสโมสร</b> ไม่ใช่ผู้จัดการทีม
          หน้าที่ของคุณคือบริหารองค์กร ตั้งงบประมาณ ลงทุน และกำหนดทิศทางสโมสร
          ส่วนการเลือกตัวผู้เล่นและแทคติกในสนามเป็นหน้าที่ของผู้จัดการทีมซึ่งเป็น NPC
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="primary" onClick={onNewCareer} data-testid="new-career">
            เริ่มอาชีพใหม่
          </button>
          {hasSave && (
            <button className="ghost" onClick={onContinue} data-testid="continue-career">
              เล่นต่อจากเซฟเดิม
            </button>
          )}
        </div>
      </section>

      <div className="footnote">
        Prototype — ข้อมูลสโมสรและนักเตะทั้งหมดเป็นข้อมูลสมมติ ไม่ใช่ข้อมูลจริง
      </div>
    </div>
  );
}
