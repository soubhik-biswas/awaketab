import type { CSSProperties } from 'react';
import { NAVY, WHITE } from '../art';
import { alpha } from '../geometry';
import { card, cardColumn, D, digitSize, type IDrawProps, Kicker, L, lmin, PLATE, Stars, type TStar } from '../kit';

// A pale dawn sky with pastel curtains and dark ink by day; a deep polar night with bright curtains at night.
const ART = {
  light: {
    sky: 'radial-gradient(120% 70% at 50% 100%, #F9F2FB, transparent 60%), linear-gradient(180deg, #F8F9FE 0%, #EFF2FB 55%, #E9EDF8 100%)',
    ink: '#0B1020',
    ink2: '#3C4257',
    line: NAVY(0.82),
    track: NAVY(0.12),
    rays: WHITE(0.7),
    blend: 'soft-light',
    edge: `inset 0 1px 0 #FFFFFF, inset 0 0 0 1px ${WHITE(0.55)}, inset 0 -48px 64px -40px ${NAVY(0.07)}`,
    veil: `radial-gradient(120% 60% at 50% 0%, ${WHITE(0.45)}, transparent 55%)`,
    glow: 'none',
    mint: '#8FE6BC',
    violet: '#C6B4FF',
    cyan: '#A6D9FF',
    opacity: [0.8, 0.75, 0.7],
  },
  night: {
    sky: 'radial-gradient(120% 70% at 50% 110%, #0B1530, transparent 60%), linear-gradient(180deg, #0A0C20 0%, #05060F 58%, #05060F 100%)',
    ink: '#FFFFFF',
    ink2: WHITE(0.8),
    line: WHITE(0.86),
    track: WHITE(0.16),
    rays: WHITE(0.32),
    blend: 'overlay',
    edge: `inset 0 1px 0 ${WHITE(0.1)}, inset 0 0 0 1px ${WHITE(0.04)}, inset 0 -48px 64px -36px rgba(5,6,15,.7)`,
    // A soft pool of night behind the time, so white digits keep their contrast over the brightest light.
    veil: 'radial-gradient(62% 44% at 50% 47%, rgba(5,6,15,.62), rgba(5,6,15,.42) 55%, rgba(5,6,15,0) 100%)',
    glow: '0 0 28px rgba(5,6,15,.45)',
    mint: '',
    violet: '#7B5CFF',
    cyan: '#3FB8FF',
    opacity: [0.92, 0.85, 0.62],
  },
} as const;
const OLED_SKY = '#000000';
const STARS: readonly TStar[] = [
  [26, 24, 2],
  [74, 50, 1.5],
  [130, 16, 2],
  [178, 54, 1.5],
  [216, 30, 1.5],
  [268, 20, 2],
  [302, 62, 1.5],
  [44, 82, 1.5],
  [252, 78, 2],
];
const STAR_COLOURS = ['#FFFFFF', '#CFE4FF', '#FFFFFF', '#E3DAFF'];

// Two ray combs of different pitch, so the curtain's vertical folds never read as a regular pattern.
const RAYS = (c: string): string =>
  `repeating-linear-gradient(90deg, transparent 0 5px, ${c} 5px 6px, transparent 6px 13px), repeating-linear-gradient(90deg, transparent 0 9px, ${c} 9px 10.5px, transparent 10.5px 19px)`;
const RAY_MASK = 'radial-gradient(70% 46% at 50% 38%, #000 0%, rgba(0,0,0,.5) 55%, transparent 100%)';

interface ICurtain {
  left: number;
  top: number;
  width: number;
  height: number;
  tilt: number;
  blur: number;
}
const CURTAINS: readonly ICurtain[] = [
  { left: -44, top: 26, width: 300, height: 170, tilt: -12, blur: 20 },
  { left: 104, top: -14, width: 284, height: 190, tilt: 10, blur: 24 },
  { left: 8, top: 150, width: 262, height: 140, tilt: -6, blur: 26 },
];
const MOVES = ['afx-drift', 'afx-drift2', 'afx-float'] as const;

// A curtain of light: a sharp bright foot that fades upward into the sky, like the real thing.
const curtain = (c: ICurtain, colour: string, opacity: number): CSSProperties => ({
  position: 'absolute',
  inset: 0,
  borderRadius: '50%',
  transform: `rotate(${c.tilt}deg)`,
  background: `linear-gradient(0deg, transparent 4%, ${colour} 24%, ${alpha(colour, 0x8c)} 48%, ${alpha(colour, 0x26)} 74%, transparent 96%)`,
  filter: `blur(${c.blur}px)`,
  opacity,
});

// A drifting northern-light sky behind thin digits: pastel dawn in light theme, polar night in dark.
export default function Aurora({ m }: IDrawProps) {
  const a = m.night ? ART.night : ART.light;
  const dayLamp = m.lampValue === m.t.lamp ? ART.light.mint : `color-mix(in srgb, ${m.lamp} 45%, #FFFFFF)`;
  // By day a resting state is a pale tint of its colour, so the dark ink stays readable and the card stays light.
  const hues = m.multi
    ? [m.night ? m.lamp : dayLamp, a.violet, a.cyan]
    : m.night
      ? [m.accent, alpha(m.accent, 0x99), m.t.track]
      : [alpha(m.accent, 0x59), alpha(m.accent, 0x33), m.t.track];
  const done = m.ringFrac <= 0 || m.indef;
  return (
    <div className={PLATE} style={card(m, { background: m.theme === 'oled' ? OLED_SKY : a.sky })}>
      {m.night && <Stars pts={STARS} colors={STAR_COLOURS} step={0.7} />}
      {CURTAINS.map((c, i) => (
        <div
          key={i}
          className={MOVES[i]}
          data-delay={i === 2 ? '-4' : undefined}
          style={{ position: 'absolute', left: c.left, top: c.top, width: c.width, height: c.height }}
        >
          <div style={curtain(c, hues[i] ?? m.accent, a.opacity[i] ?? 0.7)} />
        </div>
      ))}
      <div
        className={D}
        style={{
          position: 'absolute',
          inset: 0,
          background: RAYS(a.rays),
          mixBlendMode: a.blend,
          maskImage: RAY_MASK,
          WebkitMaskImage: RAY_MASK,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: a.veil }} />
      <div style={cardColumn(6, { height: 256, color: a.ink })}>
        <Kicker m={m} color={a.ink2} />
        <span
          style={{
            fontSize: digitSize(m, 'big'),
            fontWeight: 200,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            textShadow: a.glow,
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontSize: lmin(14), color: a.ink2, letterSpacing: '.01em' }}>
          {m.endLine}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 76,
          top: 234,
          width: 180,
          height: 2,
          borderRadius: 1,
          background: a.track,
        }}
      >
        {!m.indef && (
          <div className="af-tr" style={{ width: m.fracPct, height: 2, borderRadius: 1, background: a.line }} />
        )}
        {!done && (
          <div
            className="af-tr"
            style={{
              position: 'absolute',
              left: m.fracPct,
              top: -2,
              width: 6,
              height: 6,
              borderRadius: '50%',
              transform: 'translateX(-50%)',
              background: m.mc1,
              boxShadow: m.night ? `0 0 0 1.5px rgba(5,6,15,.8), 0 0 8px ${m.mc1}` : '0 0 0 1.5px #FFFFFF',
            }}
          />
        )}
      </div>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: a.edge }} />
    </div>
  );
}
