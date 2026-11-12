import { alpha } from '../geometry';
import { type IDrawProps, L, lmin } from '../kit';
import { AnalogDial } from './analog-dial';

// Real time on the hands; the lamp arc on the bezel runs to the end time.
export default function Analog({ m }: IDrawProps) {
  const span = m.h > 0 ? (m.m > 0 ? `${m.h} h ${m.m} min` : `${m.h} h`) : m.m > 0 ? `${m.m} min` : '< 1 min';
  // With no end the reading is the time awake so far, and before a start nothing is "left" yet.
  const label =
    m.st === 'up'
      ? "Time's up"
      : m.indef
        ? m.st === 'idle'
          ? 'No end'
          : `Awake ${span}`
        : m.st === 'idle'
          ? `Ready · ${span}`
          : `${span} left`;
  return (
    <AnalogDial m={m} luxe={false}>
      <span style={{ position: 'absolute', left: 0, width: 360, top: 196, display: 'flex', justifyContent: 'center' }}>
        <span
          className={L}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 28,
            padding: '0 12px',
            borderRadius: 999,
            background: alpha(m.accent, 0x26),
            color: m.accent,
            fontSize: lmin(14),
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </span>
    </AnalogDial>
  );
}
