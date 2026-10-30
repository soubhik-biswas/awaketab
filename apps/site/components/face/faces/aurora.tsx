import type { CSSProperties } from 'react';
import { BLACK, WHITE } from '../art';
import { alpha } from '../geometry';
import { card, cardColumn, digitSize, type IDrawProps, L, lmin, MONO } from '../kit';

const SKY = '#05060F';
const VIOLET = '#7B5CFF';
const CYAN = '#3FB8FF';
const VEIL = `radial-gradient(120% 80% at 50% 0%, ${WHITE(0.1)}, transparent 50%), radial-gradient(90% 70% at 50% 100%, ${BLACK(0.35)}, transparent 60%)`;

const light = (
  left: number,
  top: number,
  width: number,
  height: number,
  background: string,
  blur: number,
  opacity: number,
): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width,
  height,
  borderRadius: '50%',
  background,
  filter: `blur(${blur}px)`,
  opacity,
});

// Northern lights drift behind thin digits, a living wallpaper while awake.
export default function Aurora({ m }: IDrawProps) {
  const a1 = m.mc1;
  const a2 = m.multi ? VIOLET : alpha(m.accent, 0x99);
  const a3 = m.multi ? CYAN : m.t.track;
  return (
    <div style={card(m, { background: SKY })}>
      <div className="afx-drift" style={light(-50, -70, 270, 270, a1, 42, 0.9)} />
      <div className="afx-drift2" style={light(130, 50, 270, 250, a2, 48, 0.85)} />
      <div className="afx-drift" data-delay="-6" style={light(30, 170, 230, 190, a3, 44, 0.7)} />
      <div style={{ position: 'absolute', inset: 0, background: VEIL }} />
      <div style={cardColumn(4, { color: '#FFFFFF' })}>
        <span
          className={L}
          style={{
            fontFamily: MONO,
            fontSize: lmin(12),
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          {m.topWord}
        </span>
        <span
          style={{
            fontSize: digitSize(m, 'big'),
            fontWeight: 200,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            textShadow: `0 2px 30px ${BLACK(0.25)}`,
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontSize: lmin(14), opacity: 0.9 }}>
          {m.endLine}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 44,
          right: 44,
          bottom: 28,
          height: 3,
          borderRadius: 2,
          background: WHITE(0.22),
        }}
      >
        <div className="af-tr" style={{ height: 3, width: m.fracPct, borderRadius: 2, background: '#FFFFFF' }} />
      </div>
    </div>
  );
}
