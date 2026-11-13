import { alpha } from '../geometry';
import { type IDrawProps, L, lmin, MONO } from '../kit';
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
    <AnalogDial
      m={m}
      over={
        <span
          style={{ position: 'absolute', left: 0, width: 360, top: 195, display: 'flex', justifyContent: 'center' }}
        >
          <span
            className={L}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 30,
              padding: '0 14px',
              borderRadius: 999,
              background: alpha(m.accent, 0x26),
              boxShadow: `inset 0 0 0 1px ${alpha(m.accent, 0x47)}`,
              color: m.accent,
              fontSize: lmin(15),
              fontWeight: 600,
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        </span>
      }
    >
      <span
        className={L}
        style={{
          position: 'absolute',
          left: 0,
          top: 86,
          width: 360,
          textAlign: 'center',
          fontFamily: MONO,
          fontSize: lmin(9),
          fontWeight: 500,
          letterSpacing: '.32em',
          paddingLeft: '.32em',
          color: m.t.ink2,
        }}
      >
        AWAKETAB
      </span>
    </AnalogDial>
  );
}
