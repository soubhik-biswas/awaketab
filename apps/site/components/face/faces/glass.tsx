import type { CSSProperties } from 'react';
import { BLACK, NAVY, WHITE } from '../art';
import { alpha } from '../geometry';
import { card, digitSize, type IDrawProps, Kicker, L, lmin, PLATE } from '../kit';

// Pastel orbs under milk glass by day; deep orbs under smoked glass at night.
const ART = {
  light: {
    ground:
      'radial-gradient(110% 80% at 15% 0%, #FFFFFF, transparent 55%), linear-gradient(160deg, #F7F8FD 0%, #EEF0F9 55%, #E6E9F5 100%)',
    hues: ['#93E4BE', '#C3B0FF', '#A3D6FF'],
    shade: '#8F92C2',
    // Frosted white: a lit wash at the top-left corner over a milky body.
    pane: `radial-gradient(70% 60% at 12% 0%, ${WHITE(0.55)}, transparent 70%), linear-gradient(165deg, ${WHITE(0.6)}, ${WHITE(0.32)})`,
    back: `linear-gradient(165deg, ${WHITE(0.55)}, ${WHITE(0.22)})`,
    backLine: WHITE(0.85),
    frost: 'blur(22px) saturate(180%)',
    // A lit top-left edge, a faint far edge and a thin split of colour where the glass bends the light.
    edge: `inset 1px 1px 0 ${WHITE(0.95)}, inset -1px -1px 0 ${WHITE(0.5)}, inset 4px 4px 8px -4px rgba(120,170,255,.35), inset -4px -4px 8px -4px rgba(255,140,210,.3), 0 0 0 1px ${WHITE(0.4)}`,
    drop: '0 28px 44px -22px rgba(70,64,140,.38), 0 2px 6px rgba(70,64,140,.08)',
    ink: '#0B1020',
    ink2: '#3C4257',
    line: NAVY(0.8),
    track: NAVY(0.12),
    halo: '0 0 0 1.5px #FFFFFF',
  },
  night: {
    ground: 'radial-gradient(110% 80% at 15% 0%, #121733, transparent 60%), #070A16',
    hues: ['', '#7B5CFF', '#3FB8FF'],
    shade: '#04060E',
    // Smoked glass, so white digits stay readable over the brightest orb.
    pane: `radial-gradient(70% 60% at 12% 0%, ${WHITE(0.1)}, transparent 70%), linear-gradient(165deg, rgba(22,26,50,.5), rgba(7,10,22,.62))`,
    back: `linear-gradient(165deg, ${WHITE(0.1)}, ${WHITE(0.03)})`,
    backLine: WHITE(0.16),
    frost: 'blur(22px) saturate(140%)',
    edge: `inset 1px 1px 0 ${WHITE(0.28)}, inset -1px -1px 0 ${WHITE(0.07)}, inset 4px 4px 8px -4px rgba(124,187,255,.3), inset -4px -4px 8px -4px rgba(255,125,216,.22), 0 0 0 1px ${WHITE(0.07)}`,
    drop: `0 30px 50px -20px ${BLACK(0.7)}, 0 2px 6px ${BLACK(0.3)}`,
    ink: '#FFFFFF',
    ink2: WHITE(0.78),
    line: WHITE(0.86),
    track: WHITE(0.16),
    halo: '0 0 0 1.5px rgba(7,10,22,.85)',
  },
} as const;
const OLED_GROUND = '#000000';

// A lit sphere of colour: a highlight up at the top left, the colour itself, a shaded far side.
const orb = (left: number, top: number, d: number, c: string, shade: string): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width: d,
  height: d,
  borderRadius: '50%',
  background: `radial-gradient(circle at 34% 28%, color-mix(in srgb, ${c} 55%, #FFFFFF) 0%, ${c} 40%, color-mix(in srgb, ${c} 70%, ${shade}) 100%)`,
});

// Two frosted panes float over soft colour orbs; the time sits on the front glass.
export default function Glass({ m }: IDrawProps) {
  const a = m.night ? ART.night : ART.light;
  const dayLamp = m.lampValue === m.t.lamp ? ART.light.hues[0] : `color-mix(in srgb, ${m.lamp} 45%, #FFFFFF)`;
  // By day a resting state is a pale tint of its colour rather than a heavy dark disc.
  const [a1, a2, a3] = m.multi
    ? [m.night ? m.lamp : dayLamp, a.hues[1], a.hues[2]]
    : m.night
      ? [m.accent, alpha(m.accent, 0x99), m.t.track]
      : [alpha(m.accent, 0x73), alpha(m.accent, 0x4d), m.t.line];
  const done = m.ringFrac <= 0 || m.indef;
  return (
    <div className={PLATE} style={card(m, { background: m.theme === 'oled' ? OLED_GROUND : a.ground })}>
      <div className="afx-float" style={orb(-14, -24, 196, a1, a.shade)} />
      <div className="afx-float" data-delay="-4.5" style={orb(178, 118, 204, a2, a.shade)} />
      <div style={orb(222, 16, 64, a3, a.shade)} />
      <div
        style={{
          position: 'absolute',
          left: 52,
          top: 32,
          width: 228,
          height: 120,
          borderRadius: 26,
          background: a.back,
          boxShadow: `inset 1px 1px 0 ${a.backLine}, 0 0 0 1px ${alpha(a.backLine, 0x80)}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 30,
          top: 50,
          width: 272,
          height: 182,
          borderRadius: 32,
          overflow: 'hidden',
          background: a.pane,
          backdropFilter: a.frost,
          WebkitBackdropFilter: a.frost,
          boxShadow: `${a.edge}, ${a.drop}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          paddingBottom: 14,
          color: a.ink,
        }}
      >
        <Kicker m={m} color={a.ink2} />
        <span
          style={{
            fontSize: digitSize(m, 'mid'),
            fontWeight: 300,
            letterSpacing: '-0.045em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontSize: lmin(14), color: a.ink2 }}>
          {m.endLine}
        </span>
        <div
          style={{
            position: 'absolute',
            left: 56,
            top: 160,
            width: 160,
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
                boxShadow: m.night ? `${a.halo}, 0 0 8px ${m.mc1}` : a.halo,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
