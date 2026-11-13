import type { CSSProperties } from 'react';
import { BLACK, CARD_SHADOW, NAVY, SNOW, WHITE } from '../art';
import { alpha } from '../geometry';
import { DISPLAY, type IDrawProps, L, lmin, MONO, PLATE } from '../kit';
import type { TFaceState, TFaceTheme } from '../model';

interface IArt {
  housing: string;
  lab: string;
  ink: string;
  // The two halves of a tile, each shaded top to bottom.
  top: readonly [string, string];
  bottom: readonly [string, string];
  tile: string;
  split: string;
  lip: string;
  pin: string;
  rail: string;
  railShade: string;
  pct: string;
}

// An enamel board with porcelain tiles by day, a station board at night, black housing in OLED.
const NIGHT: IArt = {
  housing: `linear-gradient(180deg, ${WHITE(0.035)}, ${WHITE(0)} 40%), #0B0F18`,
  lab: '#8E99AE',
  ink: SNOW,
  top: ['#252D3F', '#1B2233'],
  bottom: ['#141A28', '#10151F'],
  tile: `0 1px 0 ${WHITE(0.04)}, 0 2px 3px ${BLACK(0.45)}, inset 0 1px 0 ${WHITE(0.06)}`,
  split: BLACK(0.8),
  lip: WHITE(0.07),
  pin: BLACK(0.7),
  rail: '#1C2436',
  railShade: `inset 0 1px 2px ${BLACK(0.5)}`,
  pct: '#C9D1E0',
};
const ART: Readonly<Record<TFaceTheme, IArt>> = {
  light: {
    housing: 'linear-gradient(180deg, #FFFFFF, #F2F3F8)',
    lab: '#5C6275',
    ink: '#0B1020',
    top: ['#FAFBFD', '#EFF1F6'],
    bottom: ['#E8EBF1', '#E1E4EB'],
    tile: `0 1px 0 #FFFFFF, 0 1px 2px ${NAVY(0.12)}, inset 0 0 0 1px ${NAVY(0.05)}`,
    split: NAVY(0.24),
    lip: WHITE(0.9),
    pin: NAVY(0.22),
    rail: '#E3E6EE',
    railShade: `inset 0 1px 1px ${NAVY(0.14)}`,
    pct: '#4B5165',
  },
  dark: NIGHT,
  oled: {
    ...NIGHT,
    housing: '#000000',
    top: ['#171C29', '#11151F'],
    bottom: ['#0C1018', '#090C12'],
    tile: `0 0 0 1px ${WHITE(0.03)}, inset 0 1px 0 ${WHITE(0.05)}`,
    rail: '#131826',
  },
};

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

const TILE_W = 26;
const TILE_H = 38;
const HALF = TILE_H / 2;

const keyStyle = (a: IArt): CSSProperties => ({
  flex: 'none',
  width: 56,
  fontFamily: MONO,
  fontSize: lmin(12),
  letterSpacing: '.02em',
  color: a.lab,
});

const CELLS = 8;
// Every row reads from its first tile, like a station board's columns.
const tiles = (text: string): string => text.padEnd(CELLS, ' ').slice(0, CELLS);

interface IRow {
  a: IArt;
  k: string;
  text: string;
  color: string;
  flap: boolean;
  live: boolean;
}

function Row({ a, k, text, color, flap, live }: IRow) {
  const cells = tiles(text).split('');
  // The tile that changes every second: the last digit of the reading.
  const tick = flap ? text.search(/\d\D*$/u) : -1;
  const upper = `linear-gradient(180deg, ${a.top[0]}, ${a.top[1]})`;
  // Each tile is two flaps: the upper one lit from above, the lower one a shade darker under it.
  const ground = `linear-gradient(180deg, ${a.top[0]} 0%, ${a.top[1]} 50%, ${a.bottom[0]} 50%, ${a.bottom[1]} 100%)`;
  // The hinge line with the lower flap's lit lip under it, and the axle pins at both edges.
  const hinge = `linear-gradient(180deg, transparent 2.5px, ${a.split} 2.5px, ${a.split} 3.5px, ${a.lip} 3.5px, ${a.lip} 4.5px, transparent 4.5px), linear-gradient(90deg, ${a.pin} 2px, transparent 2px, transparent ${TILE_W - 2}px, ${a.pin} ${TILE_W - 2}px)`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className={L} style={keyStyle(a)}>
        {k}
      </span>
      <div style={{ display: 'flex', gap: 3 }}>
        {cells.map((ch, i) => {
          const glyph = ch === ' ' ? '' : ch;
          return (
            <span
              key={i}
              style={{
                position: 'relative',
                display: 'block',
                width: TILE_W,
                height: TILE_H,
                borderRadius: 4,
                background: ground,
                boxShadow: a.tile,
                color,
                fontFamily: DISPLAY,
                fontStretch: '87.5%',
                fontSize: 27,
                fontWeight: 600,
                lineHeight: `${TILE_H}px`,
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
                overflow: 'hidden',
                perspective: 90,
              }}
            >
              {glyph}
              {i === tick && (
                // The top half of the tile falls each second, carrying the top of its character.
                <span
                  className="afx-flap"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: TILE_W,
                    height: HALF,
                    overflow: 'hidden',
                    background: upper,
                    transformOrigin: '50% 100%',
                    opacity: live ? 1 : 0,
                  }}
                >
                  {glyph}
                </span>
              )}
              <span
                style={{ position: 'absolute', left: 0, top: HALF - 3, width: TILE_W, height: 6, background: hinge }}
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
  const a = ART[m.theme];
  const left = m.digits === '∞' ? '--:--' : m.digits;
  // 12:30 PM is exactly eight tiles; a no-end session has no end time to post.
  const ends = m.indef ? 'NO END' : m.endShort;
  const done = m.indef ? '0%' : `${Math.round(100 * (1 - m.frac))}%`;
  // The board's service lamp: lit while the screen is held, a hollow ring when it is not.
  const lamp: CSSProperties = {
    flex: 'none',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: m.hollow ? 'transparent' : acc,
    boxShadow: m.hollow ? `inset 0 0 0 1.5px ${acc}` : m.night && m.awake ? `0 0 6px ${alpha(acc, 0x8c)}` : undefined,
  };
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
        background: a.housing,
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
          alignItems: 'center',
          fontFamily: MONO,
          fontSize: lmin(12),
          letterSpacing: '.16em',
          color: a.lab,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span className={m.live ? 'afx-breath' : undefined} style={lamp} />
          AWAKETAB
        </span>
        <span>{m.nowShort}</span>
      </div>
      <Row a={a} k="LEFT" text={left} color={a.ink} flap live={m.live} />
      <Row a={a} k="ENDS" text={ends} color={a.ink} flap={false} live={m.live} />
      <Row a={a} k="STATE" text={m.needs ? NEEDS_WORD : WORD[m.st]} color={acc} flap={false} live={m.live} />
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className={L} style={keyStyle(a)}>
          DONE
        </span>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: a.rail,
            boxShadow: a.railShade,
            overflow: 'hidden',
          }}
        >
          <div
            className="af-tr"
            style={{
              height: 6,
              width: done,
              borderRadius: 3,
              background: acc,
              boxShadow: `inset 0 1px 0 ${WHITE(0.3)}`,
            }}
          />
        </div>
        <span
          className={L}
          style={{
            flex: 'none',
            minWidth: 36,
            textAlign: 'right',
            fontFamily: MONO,
            fontSize: lmin(12),
            color: a.pct,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.indef ? '—' : done}
        </span>
      </div>
    </div>
  );
}
