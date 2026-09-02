import { useMemo, useState } from 'react';
import type {
  ChairmanBackground,
  ChairmanGoal,
  ChairmanPersonality,
  ChairmanProfile,
} from '../../core/chairman';
import { CHAIRMAN_ATTRIBUTE_KEYS, buildAttributes } from '../../core/chairman';
import {
  ATTRIBUTE_LABEL,
  BACKGROUNDS,
  BACKGROUND_LABEL,
  GOALS,
  GOAL_LABEL,
  PERSONALITIES,
  PERSONALITY_LABEL,
} from '../../data/chairmanOptions.data';

interface Props {
  onCreated: (profile: ChairmanProfile) => void;
  onBack: () => void;
}

export function ChairmanCreationScreen({ onCreated, onBack }: Props) {
  const [name, setName] = useState('');
  const [background, setBackground] = useState<ChairmanBackground>('businessperson');
  const [personality, setPersonality] = useState<ChairmanPersonality>('ambitious');
  const [goal, setGoal] = useState<ChairmanGoal>('promotion');

  // Attribute derivation lives in core; the UI only displays the result.
  const attributes = useMemo(
    () => buildAttributes(background, personality),
    [background, personality],
  );

  return (
    <div>
      <header className="header">
        <div>
          <div className="title">สร้างประธานสโมสร</div>
          <div className="sub">กำหนดภูมิหลัง บุคลิก และเป้าหมายส่วนตัวของคุณ</div>
        </div>
        <button className="ghost" onClick={onBack}>ย้อนกลับ</button>
      </header>

      <section className="panel">
        <div className="field">
          <label htmlFor="chairman-name">ชื่อประธานสโมสร</label>
          <input
            id="chairman-name"
            data-testid="chairman-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น สมชาย ใจดี"
          />
        </div>
      </section>

      <section className="panel">
        <h3>ภูมิหลัง</h3>
        <div className="optiongrid">
          {BACKGROUNDS.map((option) => (
            <button
              key={option}
              className={`option ${background === option ? 'selected' : ''}`}
              onClick={() => setBackground(option)}
              data-testid={`background-${option}`}
            >
              {BACKGROUND_LABEL[option]}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>บุคลิก</h3>
        <div className="optiongrid">
          {PERSONALITIES.map((option) => (
            <button
              key={option}
              className={`option ${personality === option ? 'selected' : ''}`}
              onClick={() => setPersonality(option)}
              data-testid={`personality-${option}`}
            >
              {PERSONALITY_LABEL[option]}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>เป้าหมายส่วนตัว</h3>
        <div className="optiongrid">
          {GOALS.map((option) => (
            <button
              key={option}
              className={`option ${goal === option ? 'selected' : ''}`}
              onClick={() => setGoal(option)}
              data-testid={`goal-${option}`}
            >
              {GOAL_LABEL[option]}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>คุณสมบัติ</h3>
        <div className="attrs" data-testid="attributes">
          {CHAIRMAN_ATTRIBUTE_KEYS.map((key) => (
            <div className="attr" key={key}>
              <span>{ATTRIBUTE_LABEL[key]}</span>
              <b data-testid={`attr-${key}`}>{attributes[key]}</b>
            </div>
          ))}
        </div>
      </section>

      <button
        className="primary"
        style={{ width: '100%' }}
        disabled={name.trim().length === 0}
        data-testid="confirm-chairman"
        onClick={() =>
          onCreated({ name: name.trim(), background, personality, goal, attributes })
        }
      >
        ยืนยันและเลือกสโมสร
      </button>
    </div>
  );
}
