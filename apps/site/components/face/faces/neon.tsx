import { WHITE } from '../art';
import { alpha } from '../geometry';
import { card, cardColumn, digitSize, DISPLAY, type IDrawProps, L, lmin } from '../kit';
import type { TFaceState } from '../model';

// A white-washed brick wall by day, with the tube glow in the deep accent; a dark wall at night.
const WALL = {
  light: { bg: '#F6F4F8', brick: 'rgba(11,16,32,.05)', brick2: 'rgba(11,16,32,.035)' },
  night: { bg: '#0C080E', brick: WHITE(0.03), brick2: WHITE(0.02) },
};
const VIOLET = { light: '#6633F5', night: '#9F7BFF' };
const SIGN_INK = '#F1E8FF';
const INK = { live: '#F4FFF8', still: '#E9ECF2' };
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
  const ink = light ? acc : m.live ? INK.live : INK.still;
  const signInk = m.multi ? (light ? VIOLET.light : SIGN_INK) : acc;
  const signGlow = light ? `0 0 10px ${alpha(sign, 0x55)}` : `0 0 4px #FFFFFF, 0 0 12px ${sign}, 0 0 28px ${sign}`;
  const glow = light
    ? `0 0 1px ${acc}, 0 0 12px ${alpha(acc, 0x66)}, 0 0 28px ${alpha(acc, 0x33)}`
    : `0 0 4px #FFFFFF, 0 0 10px ${acc}, 0 0 22px ${acc}, 0 0 46px ${acc}, 0 0 80px ${alpha(acc, 0x99)}`;
  return (
    <div
      style={card(m, {
        backgroundColor: wall.bg,
        backgroundImage: `repeating-linear-gradient(0deg, ${wall.brick} 0 1px, transparent 1px 30px), repeating-linear-gradient(90deg, ${wall.brick2} 0 1px, transparent 1px 60px), radial-gradient(70% 60% at 50% 45%, ${alpha(acc, 0x33)}, transparent 70%)`,
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
            color: signInk,
            textShadow: signGlow,
          }}
        >
          {WORD[m.st]}
        </span>
        <span
          style={{
            fontSize: digitSize(m, 'big'),
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
        <span className={L} style={{ fontSize: lmin(14), color: ink, opacity: 0.8, textShadow: `0 0 8px ${acc}` }}>
          {m.endLine}
        </span>
      </div>
    </div>
  );
}
