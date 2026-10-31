import { WHITE } from '../art';
import { alpha } from '../geometry';
import { card, cardColumn, digitSize, DISPLAY, type IDrawProps, L, lmin, nightAccent, nightClass } from '../kit';
import type { TFaceState } from '../model';

const WALL = '#0C080E';
const VIOLET = '#9F7BFF';
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

// A neon sign on a dark wall, with a humming flicker while awake.
export default function Neon({ m }: IDrawProps) {
  const acc = nightAccent(m);
  const sign = m.multi ? VIOLET : acc;
  const ink = m.live ? INK.live : INK.still;
  return (
    <div
      className={nightClass(m)}
      style={card(m, {
        backgroundColor: WALL,
        backgroundImage: `repeating-linear-gradient(0deg, ${WHITE(0.03)} 0 1px, transparent 1px 30px), repeating-linear-gradient(90deg, ${WHITE(0.02)} 0 1px, transparent 1px 60px), radial-gradient(70% 60% at 50% 45%, ${alpha(acc, 0x33)}, transparent 70%)`,
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
            color: m.multi ? SIGN_INK : acc,
            textShadow: `0 0 4px #FFFFFF, 0 0 12px ${sign}, 0 0 28px ${sign}`,
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
            textShadow: `0 0 4px #FFFFFF, 0 0 10px ${acc}, 0 0 22px ${acc}, 0 0 46px ${acc}, 0 0 80px ${alpha(acc, 0x99)}`,
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
