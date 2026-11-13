'use client';

import { type CSSProperties, useState } from 'react';
import { BLACK, CARD_SHADOW, NAVY, themed, type TThemed, WHITE } from '../art';
import { alpha } from '../geometry';
import { big, EndLine, type IDrawProps, Kicker, L, lmin, MONO, PLATE } from '../kit';

const PX = 14;
// The window sits 8 px inside a 320 × 100 plate at 20, 176, so the needle at 152 is the artboard's centre line.
const WIN_W = 304;
const WIN_H = 84;
const NEEDLE = 152;
// Minutes drawn either side of the needle: the window shows about eleven, the rest stays hidden under the edge fade.
const SPAN = 13;
// The drawn stretch starts on a quarter hour, so the tick patterns line up with the minutes they mark.
const QUARTER = 15;
const TICK_TOP = 10;
const NUM_TOP = 38;
const HEAT_TOP = 62;

const HOUSING: TThemed<CSSProperties> = {
  light: {
    background: 'linear-gradient(165deg, #FFFFFF 0%, #F4F5F9 50%, #E9EBF1 100%)',
    boxShadow: CARD_SHADOW.light,
  },
  dark: {
    background: `radial-gradient(120% 90% at 18% 0%, ${WHITE(0.07)}, transparent 55%), linear-gradient(165deg, #181B23 0%, #0E1015 100%)`,
    boxShadow: CARD_SHADOW.dark,
  },
  oled: { background: '#000000', boxShadow: CARD_SHADOW.oled },
};
// Paper by day, a dark film at night; the veil over spent minutes is the same ground, so they recede into it.
const TAPE: TThemed<string> = { light: '#FAF8F3', dark: '#0B0C11', oled: '#000000' };
const VEIL: TThemed<string> = { light: 'rgba(250,248,243,.68)', dark: 'rgba(11,12,17,.68)', oled: 'rgba(0,0,0,.7)' };
// The tape bends away at its top and bottom edges, under the rim of the window.
const CURL: TThemed<CSSProperties> = {
  light: {
    background: `linear-gradient(180deg, ${NAVY(0.08)}, transparent 24%, transparent 76%, ${NAVY(0.08)})`,
    boxShadow: `inset 0 2px 5px ${NAVY(0.16)}, inset 0 0 0 1px ${NAVY(0.1)}`,
  },
  dark: {
    background: `linear-gradient(180deg, ${BLACK(0.5)}, transparent 24%, transparent 76%, ${BLACK(0.5)})`,
    boxShadow: `inset 0 3px 7px ${BLACK(0.7)}, inset 0 0 0 1px ${BLACK(0.7)}`,
  },
  oled: { background: 'none', boxShadow: 'inset 0 0 0 1px #1A2236' },
};
const CURSOR: TThemed<CSSProperties> = {
  light: { background: WHITE(0.22), boxShadow: `inset 1px 0 0 ${NAVY(0.1)}, inset -1px 0 0 ${NAVY(0.1)}` },
  dark: { background: WHITE(0.035), boxShadow: `inset 1px 0 0 ${WHITE(0.08)}, inset -1px 0 0 ${WHITE(0.08)}` },
  oled: { background: WHITE(0.03), boxShadow: `inset 1px 0 0 ${WHITE(0.08)}, inset -1px 0 0 ${WHITE(0.08)}` },
};
const EDGE_MASK = 'linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)';

const mark = (min: number): string => {
  if (min < 60) return String(min);
  const mm = min % 60;
  return `${Math.floor(min / 60)}h${mm ? String(mm).padStart(2, '0') : ''}`;
};

// Three tick weights from one box: a tick every minute, a longer one every five and the longest every quarter hour.
const ticks = (c1: string, c5: string, c15: string): CSSProperties => ({
  backgroundImage: [c15, c5, c1]
    .map((c, i) => `linear-gradient(90deg, ${c} 0 ${2 - i / 2}px, transparent 0)`)
    .join(', '),
  backgroundSize: `${QUARTER * PX}px 24px, ${5 * PX}px 17px, ${PX}px 10px`,
  backgroundPosition: '0 0, 0.25px 0, 0.5px 0',
  backgroundRepeat: 'repeat-x',
});

// A minute ruler glides under a fixed needle in a glass cursor; the heat strip shows the final stretch.
export default function Tape({ m }: IDrawProps) {
  const { t, theme } = m;
  // A no-end session counts up, so before it starts the needle rests on zero.
  const now = m.indef && m.st === 'idle' ? 0 : m.shownSec / 60;
  // The window also covers where the ruler was a second ago, so a jump of many minutes glides past drawn ticks.
  const [trail, setTrail] = useState({ now, was: now });
  if (trail.now !== now) setTrail({ now, was: trail.now });
  const end = m.indef ? Infinity : Math.max(5, Math.ceil(m.total / 60));
  const lo = Math.max(0, Math.floor((Math.min(now, trail.was) - SPAN) / QUARTER) * QUARTER);
  const hi = Math.min(end, Math.ceil(Math.max(now, trail.was)) + SPAN);
  const nums: number[] = [];
  for (let i = lo; i <= hi; i += 5) nums.push(i);
  // The strip is coloured by the stretch each minute falls in, so the last twelfth reads ember before the needle gets
  // there; a session without an end has no final stretch and draws one even colour.
  const heat: CSSProperties = m.indef
    ? {
        backgroundImage: 'none',
        backgroundColor: alpha(m.mc1, 0x99),
        backgroundSize: 'auto',
        backgroundPosition: '0 0',
      }
    : {
        backgroundImage: `linear-gradient(90deg, ${m.heat(0.05)} 0 8.4%, ${m.heat(0.2)} 0 25%, ${m.heat(0.4)} 0 50%, ${m.heat(0.6)} 0)`,
        backgroundColor: 'transparent',
        backgroundSize: `${end * PX}px 100%`,
        backgroundPosition: `${-lo * PX}px 0`,
      };
  // Counting down, the minutes past the needle are spent; counting up, the minutes behind it are.
  const spent: CSSProperties = m.indef ? { left: 0, width: NEEDLE } : { left: NEEDLE, right: 0 };
  // The ends of the tape: zero, and the session's length when it has one.
  const stops = [0, end].filter((i) => Number.isFinite(i) && i >= lo && i <= hi);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 26,
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Kicker m={m} />
        <span style={big(m.long ? 52 : 72, 300, '-0.045em')}>{m.digits}</span>
        <EndLine m={m} px={14} />
      </div>
      <div
        className={PLATE}
        style={{
          position: 'absolute',
          left: 20,
          top: 176,
          width: 320,
          height: 100,
          borderRadius: 22,
          ...themed(theme, HOUSING),
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 8,
            top: 8,
            width: WIN_W,
            height: WIN_H,
            borderRadius: 14,
            background: TAPE[theme],
            overflow: 'hidden',
            isolation: 'isolate',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: EDGE_MASK, maskImage: EDGE_MASK }}>
            <div
              className="af-tr"
              style={{
                position: 'absolute',
                top: 0,
                left: `${(NEEDLE - now * PX).toFixed(1)}px`,
                width: 0,
                height: WIN_H,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: lo * PX - 1,
                  top: TICK_TOP,
                  width: (hi - lo) * PX + 2,
                  height: 24,
                  ...ticks(alpha(t.ink2, 0x8c), alpha(t.ink, 0xa6), t.ink),
                }}
              />
              {stops.map((i) => (
                <span
                  key={`s${i}`}
                  style={{
                    position: 'absolute',
                    left: i * PX - 1.5,
                    top: TICK_TOP - 4,
                    width: 3,
                    height: 32,
                    borderRadius: 1.5,
                    background: t.ink,
                  }}
                />
              ))}
              {nums.map((i) => (
                <span
                  key={i}
                  className={L}
                  style={{
                    position: 'absolute',
                    left: i * PX - 30,
                    top: NUM_TOP,
                    width: 60,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    fontFamily: MONO,
                    fontSize: lmin(12),
                    lineHeight: 1,
                    fontWeight: i % QUARTER === 0 ? 500 : 400,
                    color: i % QUARTER === 0 ? t.ink : t.ink2,
                  }}
                >
                  {mark(i)}
                </span>
              ))}
              <div
                style={{
                  position: 'absolute',
                  left: lo * PX,
                  top: HEAT_TOP,
                  width: (hi - lo) * PX,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundRepeat: 'no-repeat',
                  ...heat,
                }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                ...spent,
                background: `repeating-linear-gradient(135deg, ${alpha(t.ink2, 0x1a)} 0 1px, transparent 1px 6px), ${VEIL[theme]}`,
              }}
            />
          </div>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', ...themed(theme, CURL) }} />
          <div
            style={{
              position: 'absolute',
              left: NEEDLE - 14,
              top: 0,
              width: 28,
              height: WIN_H,
              ...themed(theme, CURSOR),
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: NEEDLE - 1,
              top: 0,
              width: 2,
              height: WIN_H,
              background: m.mc1,
              boxShadow: `0 0 6px ${alpha(m.mc1, 0x73)}`,
            }}
          />
          <svg
            style={{ position: 'absolute', left: NEEDLE - 6, top: 0 }}
            width="12"
            height={WIN_H}
            viewBox={`0 0 12 ${WIN_H}`}
            aria-hidden="true"
          >
            <path d={`M0 0H12L6 7Z M0 ${WIN_H}H12L6 ${WIN_H - 7}Z`} style={{ fill: m.mc1 }} />
          </svg>
        </div>
      </div>
    </>
  );
}
