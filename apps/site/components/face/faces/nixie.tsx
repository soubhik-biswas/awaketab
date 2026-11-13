import type { CSSProperties } from 'react';
import { BLACK, NAVY, WHITE } from '../art';
import { alpha } from '../geometry';
import { D, EndLine, type IDrawProps, L, mono } from '../kit';

// Frosted tubes on a pale plinth by day, smoked glass on a dark plinth at night.
const ART = {
  light: {
    tube: '#F4F5F8',
    edge: '#C9CEDA',
    mesh: NAVY(0.11),
    cathode: NAVY(0.075),
    sheen: WHITE(0.95),
    rim: WHITE(0.7),
    shade: NAVY(0.08),
    socket: 'linear-gradient(180deg, #D9DDE5, #A7AEBC)',
    base: 'linear-gradient(180deg, #F3F4F8 0%, #E3E6ED 16%, #C9CED9 100%)',
    baseEdge: '#B8BECB',
    baseShadow: NAVY(0.14),
    baseInk: '#4B5165',
  },
  night: {
    tube: '#0A0D12',
    edge: '#2A3240',
    mesh: 'rgba(150,162,184,.17)',
    cathode: WHITE(0.075),
    sheen: WHITE(0.17),
    rim: WHITE(0.05),
    shade: BLACK(0.55),
    socket: 'linear-gradient(180deg, #2E3440, #12151C)',
    base: 'linear-gradient(180deg, #363D4C 0%, #262C38 16%, #12161E 100%)',
    baseEdge: '#07090D',
    baseShadow: BLACK(0.45),
    baseInk: '#A9B3C7',
  },
};
// The anode: a fine honeycomb in front of the cathodes, 9 × 5 per cell.
const mesh = (c: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='9' height='5'><path d='M3 0H6L7.5 2.5L6 5H3L1.5 2.5ZM7.5 2.5H9M0 2.5H1.5' stroke='${c}' stroke-width='.6' fill='none'/></svg>`,
  )}")`;
// The unlit cathodes stacked behind the lit one, as bare wire.
const STACK = ['0', '2', '5', '8'] as const;

// The tube is 66 wide: a 155 px envelope under a small exhaust tip, sunk 4 px into its socket.
const TUBE_W = 66;
const GLASS_TOP = 5;
const GLASS_H = 155;
// The digit's centre in the envelope, below the dome; Inter's 110 px line puts it 55 px under the line's top.
const DIGIT_Y = 88;

const glyph: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: DIGIT_Y - 55,
  textAlign: 'center',
  fontSize: 88,
  lineHeight: '110px',
  fontWeight: 200,
};
const cover: CSSProperties = { position: 'absolute', inset: 0 };

type TLevel = 'full' | 'dim' | 'off';
const core = (c: string): string => `color-mix(in srgb, ${c} 58%, #FFFFFF)`;

// The neon light hugs the wire: a pale core, the lamp colour, then a short halo.
const lit = (level: TLevel, night: boolean, c: string): CSSProperties => {
  if (level === 'off') return { color: c, textShadow: 'none' };
  if (level === 'dim') return { color: c, textShadow: `0 0 6px ${alpha(c, night ? 0x40 : 0x26)}` };
  return night
    ? {
        color: core(c),
        textShadow: `0 0 1px ${c}, 0 0 4px ${c}, 0 0 10px ${alpha(c, 0x8c)}, 0 0 18px ${alpha(c, 0x40)}`,
      }
    : { color: c, textShadow: `0 0 1px ${c}, 0 0 6px ${alpha(c, 0x59)}, 0 0 14px ${alpha(c, 0x26)}` };
};

// Glass tubes with a honeycomb mesh and stacked cathodes; the glow takes the lamp colour.
export default function Nixie({ m }: IDrawProps) {
  const { accent, night } = m;
  const a = night ? ART.night : ART.light;
  // Time's up leaves the cathodes cold; ready warms them a little; no end before it starts leaves the tubes dark.
  const level: TLevel = m.st === 'up' ? 'off' : m.st === 'idle' ? 'dim' : 'full';
  const dark = m.digits === '∞';
  const ink = lit(level, night, level === 'dim' ? m.t.ink2 : accent);
  const units = dark ? 'NO END' : m.h > 0 ? 'HR · MIN' : 'MIN · SEC';
  const spill =
    level === 'full' && !dark
      ? `radial-gradient(44% 30% at 50% ${((DIGIT_Y / GLASS_H) * 100).toFixed(1)}%, ${alpha(accent, night ? 0x2e : 0x1a)}, transparent 72%)`
      : undefined;
  const bulbCore: CSSProperties = {
    position: 'absolute',
    left: 3,
    top: 3,
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: level === 'full' ? (night ? core(accent) : accent) : alpha(accent, 0x66),
    boxShadow: level === 'full' ? `0 0 3px ${accent}, 0 0 7px ${alpha(accent, 0x80)}` : 'none',
  };
  const bulb = (
    <span
      style={{
        position: 'relative',
        display: 'block',
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, ${a.sheen}, transparent 45%), ${a.tube}`,
        border: `1px solid ${a.edge}`,
      }}
    >
      <span className="afx-blink" style={bulbCore} />
    </span>
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 40,
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        {m.four.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', width: TUBE_W, height: 172 }}>
              <span
                className={D}
                style={{
                  position: 'absolute',
                  left: 29,
                  top: 0,
                  width: 8,
                  height: 8,
                  borderRadius: '4px 4px 2px 2px',
                  background: `linear-gradient(90deg, ${a.sheen}, ${a.tube} 60%)`,
                  border: `1px solid ${a.edge}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: GLASS_TOP,
                  width: TUBE_W,
                  height: GLASS_H,
                  borderRadius: '33px 33px 8px 8px',
                  backgroundColor: a.tube,
                  backgroundImage: spill,
                  border: `1px solid ${a.edge}`,
                  boxShadow: `inset 3px 0 6px ${a.rim}, inset -6px 0 10px ${a.shade}, inset 0 -12px 14px ${a.shade}`,
                  overflow: 'hidden',
                }}
              >
                {STACK.map((g) => (
                  <span key={g} className={D} style={{ ...glyph, color: a.cathode }}>
                    {g}
                  </span>
                ))}
                <span className="afx-flick" data-delay={i * 1.3} style={{ ...glyph, ...ink }}>
                  {dark ? '' : d}
                </span>
                <span className={D} style={{ ...cover, backgroundImage: mesh(a.mesh), backgroundPosition: 'center' }} />
                <span
                  className={D}
                  style={{
                    ...cover,
                    backgroundImage: `radial-gradient(56% 20% at 40% 6%, ${a.sheen}, transparent 70%), linear-gradient(90deg, transparent 8%, ${a.sheen} 13%, ${a.rim} 20%, transparent 27%, transparent 80%, ${a.rim} 86%, transparent 91%)`,
                  }}
                />
              </div>
              <span
                style={{
                  position: 'absolute',
                  left: -2,
                  top: GLASS_TOP + GLASS_H - 4,
                  width: TUBE_W + 4,
                  height: 172 - (GLASS_TOP + GLASS_H - 4),
                  borderRadius: '3px 3px 5px 5px',
                  background: a.socket,
                  boxShadow: `inset 0 1px 0 ${WHITE(night ? 0.14 : 0.8)}, inset 0 -1px 0 ${BLACK(0.25)}`,
                }}
              />
            </div>
            {i === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 14 }}>
                {bulb}
                {bulb}
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'relative',
          width: 336,
          height: 24,
          borderRadius: 6,
          background: a.base,
          boxShadow: `inset 0 1px 0 ${WHITE(night ? 0.14 : 0.9)}, inset 0 -1px 0 ${BLACK(0.3)}, 0 0 0 1px ${a.baseEdge}, 0 10px 20px ${a.baseShadow}`,
        }}
      >
        <span
          className={L}
          style={{
            position: 'absolute',
            left: 14,
            top: 0,
            lineHeight: '24px',
            whiteSpace: 'nowrap',
            ...mono(12, '.16em', a.baseInk),
          }}
        >
          {units}
        </span>
        <span
          className="afx-breath"
          style={{
            position: 'absolute',
            right: 12,
            top: 8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: level === 'off' ? a.edge : accent,
            boxShadow:
              level === 'off'
                ? `inset 0 1px 1px ${BLACK(0.4)}`
                : `inset 0 -1px 1px ${BLACK(0.2)}, 0 0 6px ${alpha(accent, 0x99)}`,
          }}
        />
      </div>
      <EndLine m={m} px={15} style={{ marginTop: 14 }} />
    </div>
  );
}
