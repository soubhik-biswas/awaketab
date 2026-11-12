import type { CSSProperties } from 'react';
import { BLACK, CARD_SHADOW, SNOW } from '../art';
import { type IDrawProps, L, lmin, MONO, PLATE } from '../kit';
import type { TFaceState } from '../model';

// A white board with pale tiles by day, a station board at night.
const ART = {
  light: {
    bg: '#FFFFFF',
    lab: '#5C6275',
    split: 'rgba(11,16,32,.14)',
    flap: '#E3E6EE',
    pct: '#4B5165',
    cell: '#EEF0F6',
  },
  night: { bg: '#0B0F18', lab: '#8E99AE', split: BLACK(0.6), flap: '#1C2436', pct: '#C9D1E0', cell: '#161D2C' },
};
type TArt = (typeof ART)['light'];

// The STATE row: AWAKE only while the screen is held, PAUSED only when the person paused.
const WORD: Readonly<Record<TFaceState, string>> = {
  idle: 'READY',
  starting: 'START',
  running: 'AWAKE',
  fallback: 'VIDEO',
  paused: 'PAUSED',
  blocked: 'BLOCKED',
  unsupported: 'NOLOCK',
  up: 'ENDED',
};
// A hidden tab let the lock go: not awake until a tap, with the clock still counting.
const NEEDS_WORD = 'NOTAWAKE';

const keyStyle = (a: TArt): CSSProperties => ({
  flex: 'none',
  width: 56,
  fontFamily: MONO,
  fontSize: lmin(12),
  letterSpacing: '.02em',
  color: a.lab,
});

interface IRow {
  a: TArt;
  k: string;
  text: string;
  color: string;
  flap: boolean;
  live: boolean;
}

function Row({ a, k, text, color, flap, live }: IRow) {
  const cells = text.split('');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className={L} style={keyStyle(a)}>
        {k}
      </span>
      <div style={{ display: 'flex', gap: 3 }}>
        {cells.map((ch, i) => {
          const flaps = flap && i === cells.length - 3;
          return (
            <span
              key={i}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 26,
                height: 38,
                borderRadius: 4,
                background: a.cell,
                color,
                fontFamily: MONO,
                fontSize: 24,
                fontWeight: 500,
                overflow: 'hidden',
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>{ch === ' ' ? '' : ch}</span>
              <span style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: a.split }} />
              <span
                className={flaps ? 'afx-flap' : undefined}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: '50%',
                  background: a.flap,
                  transformOrigin: '50% 100%',
                  opacity: flaps && live ? 1 : 0,
                }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Split-flap tiles like a station board; the seconds tile flaps each tick.
export default function Board({ m }: IDrawProps) {
  const acc = m.accent;
  const a = m.night ? ART.night : ART.light;
  const left = m.digits.length <= 5 ? ` ${m.digits}  `.slice(0, 8) : m.digits.slice(0, 8).padEnd(8, ' ');
  const ends = m.endShort.replace(' ', '').padEnd(8, ' ').slice(0, 8);
  const ink = m.night ? SNOW : '#0B1020';
  const done = `${Math.round(100 * (1 - m.frac))}%`;
  return (
    <div
      className={PLATE}
      style={{
        position: 'absolute',
        left: 14,
        top: 34,
        width: 332,
        height: 240,
        borderRadius: 18,
        background: a.bg,
        boxShadow: CARD_SHADOW[m.theme],
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        className={L}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: MONO,
          fontSize: lmin(12),
          letterSpacing: '.16em',
          color: a.lab,
        }}
      >
        <span>AWAKETAB</span>
        <span>{m.nowShort}</span>
      </div>
      <Row a={a} k="LEFT" text={left} color={ink} flap live={m.live} />
      <Row a={a} k="ENDS" text={ends} color={ink} flap={false} live={m.live} />
      <Row
        a={a}
        k="STATE"
        text={(m.needs ? NEEDS_WORD : WORD[m.st]).padEnd(8, ' ').slice(0, 8)}
        color={acc}
        flap={false}
        live={m.live}
      />
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className={L} style={keyStyle(a)}>
          DONE
        </span>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: a.flap, overflow: 'hidden' }}>
          <div className="af-tr" style={{ height: 6, width: done, borderRadius: 3, background: acc }} />
        </div>
        <span
          className={L}
          style={{ fontFamily: MONO, fontSize: lmin(12), color: a.pct, fontVariantNumeric: 'tabular-nums' }}
        >
          {done}
        </span>
      </div>
    </div>
  );
}
