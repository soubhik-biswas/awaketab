import type { CSSProperties } from 'react';
import { BLACK, NAVY, WHITE } from '../art';
import { alpha } from '../geometry';
import { card, D, digitSize, DISPLAY, fit, type IDrawProps, L, lmin, PLATE } from '../kit';
import type { TFaceState } from '../model';

// A white-washed brick wall by day, with the tube glow in the deep accent; a dark wall at night.
const WALL = {
  light: { bg: '#F6F4F8', brick: 'rgba(11,16,32,.06)' },
  night: { bg: '#0C080E', brick: WHITE(0.035) },
};
// Running bond: each course of 56 × 24 bricks sits half a brick along from the one below.
const bricks = (c: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='48'><path d='M0 .5H56M0 24.5H56M.5 0V24M28.5 24V48' stroke='${c}' fill='none'/></svg>`,
  )}")`;
const VIOLET = { light: '#6633F5', night: '#9F7BFF' };
// The sign: AWAKE only while the screen is held, PAUSED only when the person paused.
const WORD: Readonly<Record<TFaceState, string>> = {
  idle: 'READY',
  starting: 'WAKING',
  running: 'AWAKE',
  fallback: 'AWAKE',
  paused: 'PAUSED',
  blocked: 'BLOCKED',
  unsupported: 'NO LOCK',
  up: 'GOOD NIGHT',
};
// The clear acrylic backing plate the tubes are mounted on, held off the wall by four standoffs.
const PW = 296;
const PH = 202;
const SCREWS = [
  [12, 12],
  [PW - 20, 12],
  [12, PH - 20],
  [PW - 20, PH - 20],
] as const;

type TLevel = 'full' | 'low' | 'off';

// A lit tube: a pale core, the gas colour around it, then a soft halo; by day the tube also casts a shadow on the plate.
const tube = (level: TLevel, light: boolean, c: string, cold: string): CSSProperties => {
  const cast = `3px 7px 6px ${NAVY(0.12)}`;
  if (level === 'off') return { color: cold, textShadow: light ? cast : `0 1px 1px ${BLACK(0.8)}` };
  if (light)
    return {
      color: c,
      textShadow:
        level === 'full'
          ? `0 0 1px ${c}, 0 0 6px ${alpha(c, 0x66)}, 0 0 16px ${alpha(c, 0x2e)}, ${cast}`
          : `0 0 1px ${c}, 0 0 6px ${alpha(c, 0x40)}, ${cast}`,
    };
  return level === 'full'
    ? {
        color: `color-mix(in srgb, ${c} 40%, #FFFFFF)`,
        textShadow: `0 0 1px ${c}, 0 0 3px ${c}, 0 0 8px ${alpha(c, 0xb3)}, 0 0 18px ${alpha(c, 0x80)}, 0 0 34px ${alpha(c, 0x40)}`,
      }
    : {
        color: `color-mix(in srgb, ${c} 72%, #FFFFFF)`,
        textShadow: `0 0 2px ${c}, 0 0 7px ${alpha(c, 0x80)}, 0 0 18px ${alpha(c, 0x33)}`,
      };
};

// A neon sign on an acrylic plate on a brick wall, with a humming flicker while awake.
export default function Neon({ m }: IDrawProps) {
  const light = !m.night;
  const acc = m.accent;
  const wall = light ? WALL.light : WALL.night;
  const sign = m.multi ? VIOLET[light ? 'light' : 'night'] : acc;
  // The tubes burn full while awake, hum low while held or waiting, and go cold when time is up.
  const level: TLevel = m.st === 'up' ? 'off' : m.multi ? 'full' : 'low';
  const lit = level !== 'off';
  const spill = lit
    ? `radial-gradient(70% 60% at 50% 48%, ${alpha(acc, level === 'low' ? 0x1a : 0x2e)}, transparent 70%), `
    : '';
  const room = light
    ? `linear-gradient(155deg, ${WHITE(0.7)}, transparent 45%), radial-gradient(130% 100% at 50% 45%, transparent 55%, ${NAVY(0.06)})`
    : `radial-gradient(130% 100% at 50% 45%, transparent 50%, ${BLACK(0.5)})`;
  const plate: CSSProperties = light
    ? {
        background: `linear-gradient(155deg, ${WHITE(0.92)}, ${WHITE(0.6)} 60%, ${WHITE(0.5)})`,
        boxShadow: `inset 0 1px 0 #FFFFFF, inset 0 0 0 1px ${WHITE(0.6)}, 0 0 0 1px ${NAVY(0.07)}, 0 14px 28px ${NAVY(0.1)}, 0 2px 5px ${NAVY(0.06)}`,
      }
    : {
        background: `linear-gradient(155deg, ${WHITE(0.07)}, ${WHITE(0.02)} 38%, ${WHITE(0.012)})`,
        // Lit from inside, the acrylic's cut edge and face pick up the tube colour.
        boxShadow: `${lit ? `inset 0 0 26px ${alpha(acc, level === 'low' ? 0x0f : 0x1c)}, inset 0 0 0 1px ${alpha(acc, 0x2a)}, ` : ''}inset 0 1px 0 ${WHITE(0.12)}, inset 0 0 0 1px ${WHITE(0.05)}, 0 0 0 1px ${BLACK(0.4)}, 0 20px 34px ${BLACK(0.5)}`,
      };
  const screw = light
    ? {
        background: 'radial-gradient(circle at 35% 30%, #FFFFFF, #C4C9D4 60%, #8A90A0)',
        boxShadow: `0 1px 2px ${NAVY(0.25)}`,
      }
    : {
        background: 'radial-gradient(circle at 35% 30%, #C9CED8, #6B7280 60%, #3A3F4A)',
        boxShadow: `0 1px 2px ${BLACK(0.6)}`,
      };
  return (
    <div
      className={PLATE}
      style={card(m, {
        backgroundColor: wall.bg,
        backgroundImage: `${spill}${room}, ${bricks(wall.brick)}`,
        backgroundPosition: 'center',
      })}
    >
      <div
        style={{
          position: 'absolute',
          left: (332 - PW) / 2,
          top: (282 - PH) / 2,
          width: PW,
          height: PH,
          borderRadius: 18,
          ...plate,
        }}
      >
        {SCREWS.map(([x, y]) => (
          <span
            key={`${x}-${y}`}
            className={D}
            style={{ position: 'absolute', left: x, top: y, width: 8, height: 8, borderRadius: '50%', ...screw }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <span
            className={`afx-flick ${L}`}
            style={{
              fontFamily: DISPLAY,
              fontStretch: '125%',
              fontSize: lmin(15),
              fontWeight: 600,
              letterSpacing: '.3em',
              textIndent: '.3em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              ...tube(level, light, sign, m.t.ink2),
            }}
          >
            {m.needs ? m.topWord : WORD[m.st]}
          </span>
          <span
            style={{
              fontSize: fit(m, digitSize(m, 'big'), 56),
              whiteSpace: 'nowrap',
              fontWeight: 300,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              ...tube(level, light, acc, m.t.ink2),
            }}
          >
            {m.digits}
          </span>
          <span className={L} style={{ fontSize: lmin(14), whiteSpace: 'nowrap', color: m.t.ink2 }}>
            {m.endLine}
          </span>
        </div>
      </div>
    </div>
  );
}
