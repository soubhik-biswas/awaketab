import { WHITE } from '../art';
import { alpha } from '../geometry';
import { card, cardColumn, digitSize, DISPLAY, fit, type IDrawProps, L, lmin, PLATE } from '../kit';
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
const SIGN_INK = '#F1E8FF';
const INK = { live: '#F4FFF8', still: '#E9ECF2' };
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

// A neon sign on a wall, with a humming flicker while awake.
export default function Neon({ m }: IDrawProps) {
  const light = !m.night;
  const acc = m.accent;
  const wall = light ? WALL.light : WALL.night;
  const sign = m.multi ? VIOLET[light ? 'light' : 'night'] : acc;
  // The tubes burn full while awake, hum low while held or waiting, and go cold when time is up.
  const off = m.st === 'up';
  const low = !m.multi && !off;
  const ink = light ? acc : off ? m.t.ink2 : m.live ? INK.live : INK.still;
  const signInk = m.multi ? (light ? VIOLET.light : SIGN_INK) : acc;
  const signGlow = off
    ? 'none'
    : light
      ? `0 0 10px ${alpha(sign, 0x55)}`
      : low
        ? `0 0 3px ${sign}, 0 0 14px ${alpha(sign, 0x88)}`
        : `0 0 4px #FFFFFF, 0 0 12px ${sign}, 0 0 28px ${sign}`;
  const glow = off
    ? 'none'
    : light
      ? low
        ? `0 0 1px ${acc}, 0 0 12px ${alpha(acc, 0x40)}`
        : `0 0 1px ${acc}, 0 0 12px ${alpha(acc, 0x55)}, 0 0 26px ${alpha(acc, 0x2a)}`
      : low
        ? `0 0 3px ${acc}, 0 0 14px ${alpha(acc, 0x99)}, 0 0 30px ${alpha(acc, 0x55)}`
        : `0 0 4px #FFFFFF, 0 0 10px ${acc}, 0 0 22px ${acc}, 0 0 40px ${alpha(acc, 0xcc)}, 0 0 60px ${alpha(acc, 0x66)}`;
  return (
    <div
      className={PLATE}
      style={card(m, {
        backgroundColor: wall.bg,
        backgroundImage: `${off ? '' : `radial-gradient(70% 60% at 50% 45%, ${alpha(acc, low ? 0x1f : 0x33)}, transparent 70%), `}${bricks(wall.brick)}`,
        backgroundPosition: 'center',
      })}
    >
      <div style={cardColumn(8)}>
        <span
          className={`afx-flick ${L}`}
          style={{
            fontFamily: DISPLAY,
            fontStretch: '125%',
            fontSize: lmin(15),
            fontWeight: 700,
            letterSpacing: '.3em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: signInk,
            textShadow: signGlow,
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
            color: ink,
            textShadow: glow,
          }}
        >
          {m.digits}
        </span>
        <span
          className={L}
          style={{
            fontSize: lmin(14),
            whiteSpace: 'nowrap',
            color: ink,
            ...(light || off ? null : { opacity: 0.8, textShadow: `0 0 8px ${acc}` }),
          }}
        >
          {m.endLine}
        </span>
      </div>
    </div>
  );
}
