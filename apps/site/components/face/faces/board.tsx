import type { CSSProperties } from 'react';
import { BLACK, CARD_SHADOW, SNOW } from '../art';
import { type IDrawProps, L, lmin, MONO } from '../kit';
import type { TFaceModel, TFaceState } from '../model';

const PANEL = '#0B0F18';
const KEY_INK = 'var(--muted-foreground)';
const CELL = '#161D2C';
const FLAP = '#1C2436';
const DONE_INK = '#C9D1E0';

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

// The board is always a dark panel, so it draws in the dark theme's tokens (its root carries .dark) on a light page.
const NIGHT_STATUS: Readonly<Partial<Record<TFaceState, string>>> = {
  idle: 'var(--muted-foreground-strong)',
  paused: 'var(--warning)',
  blocked: 'var(--destructive)',
  unsupported: 'var(--info)',
  up: 'var(--ended)',
};

const boardAccent = (m: TFaceModel): string => (m.night ? m.accent : (NIGHT_STATUS[m.st] ?? m.lampValue));

const keyStyle: CSSProperties = {
  flex: 'none',
  width: 56,
  fontFamily: MONO,
  fontSize: lmin(12),
  letterSpacing: '.02em',
  color: KEY_INK,
};

function Row({ k, text, color, flap, live }: { k: string; text: string; color: string; flap: boolean; live: boolean }) {
  const cells = text.split('');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className={L} style={keyStyle}>
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
                background: CELL,
                color,
                fontFamily: MONO,
                fontSize: 24,
                fontWeight: 500,
                overflow: 'hidden',
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>{ch === ' ' ? '' : ch}</span>
              <span
                style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: BLACK(0.6) }}
              />
              <span
                className={flaps ? 'afx-flap' : undefined}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: '50%',
                  background: FLAP,
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
  const acc = boardAccent(m);
  const left = m.digits.length <= 5 ? ` ${m.digits}  `.slice(0, 8) : m.digits.slice(0, 8).padEnd(8, ' ');
  const ends = m.endShort.replace(' ', '').padEnd(8, ' ').slice(0, 8);
  const done = `${Math.round(100 * (1 - m.frac))}%`;
  return (
    <div
      className={m.night ? undefined : 'dark'}
      style={{
        position: 'absolute',
        left: 14,
        top: 34,
        width: 332,
        height: 240,
        borderRadius: 18,
        background: PANEL,
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
          color: KEY_INK,
        }}
      >
        <span>AWAKETAB</span>
        <span>{m.nowShort}</span>
      </div>
      <Row k="LEFT" text={left} color={SNOW} flap live={m.live} />
      <Row k="ENDS" text={ends} color={SNOW} flap={false} live={m.live} />
      <Row k="STATE" text={WORD[m.st].padEnd(8, ' ').slice(0, 8)} color={acc} flap={false} live={m.live} />
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className={L} style={keyStyle}>
          DONE
        </span>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: FLAP, overflow: 'hidden' }}>
          <div className="af-tr" style={{ height: 6, width: done, borderRadius: 3, background: acc }} />
        </div>
        <span
          className={L}
          style={{ fontFamily: MONO, fontSize: lmin(12), color: DONE_INK, fontVariantNumeric: 'tabular-nums' }}
        >
          {done}
        </span>
      </div>
    </div>
  );
}
