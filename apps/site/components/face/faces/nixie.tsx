import type { CSSProperties } from 'react';
import { BLACK, NAVY, WHITE } from '../art';
import { alpha } from '../geometry';
import { EndLine, type IDrawProps } from '../kit';

// Frosted tubes on a pale base by day, smoked glass on a dark base at night.
const ART = {
  light: {
    tube: '#F7F7FA',
    edge: '#CDD1DC',
    mesh: NAVY(0.06),
    ghost: NAVY(0.06),
    base: 'linear-gradient(180deg, #ECEEF4, #CDD2DD)',
    baseShadow: NAVY(0.12),
  },
  night: {
    tube: '#0A0D12',
    edge: '#2A3240',
    mesh: WHITE(0.04),
    ghost: WHITE(0.05),
    base: 'linear-gradient(180deg, #2A3140, #12161E)',
    baseShadow: BLACK(0.35),
  },
};
const glow = (light: boolean, c: string): string =>
  light
    ? `0 0 1px ${c}, 0 0 10px ${alpha(c, 0x55)}, 0 0 22px ${alpha(c, 0x22)}`
    : `0 0 4px ${c}, 0 0 18px ${alpha(c, 0x4d)}, 0 0 40px ${alpha(c, 0x33)}`;

const glyph: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 32,
  textAlign: 'center',
  fontSize: 96,
  lineHeight: '110px',
  fontWeight: 200,
};

// Glass tubes with mesh and ghost 8s; the glow takes the lamp colour.
export default function Nixie({ m }: IDrawProps) {
  const { accent } = m;
  const a = m.night ? ART.night : ART.light;
  const ink = m.st === 'idle' ? m.t.ink2 : accent;
  const colonDot: CSSProperties = {
    display: 'block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: accent,
    boxShadow: `0 0 10px ${accent}`,
  };
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 34,
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        {m.four.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              className="afx-flick"
              data-delay={i * 1.3}
              style={{
                position: 'relative',
                width: 66,
                height: 166,
                borderRadius: '33px 33px 10px 10px',
                backgroundColor: a.tube,
                border: `1px solid ${a.edge}`,
                overflow: 'hidden',
                backgroundImage: `radial-gradient(ellipse at 50% 18%, ${WHITE(0.1)}, transparent 60%), repeating-linear-gradient(60deg, ${a.mesh} 0 1px, transparent 1px 7px), repeating-linear-gradient(-60deg, ${a.mesh} 0 1px, transparent 1px 7px)`,
              }}
            >
              <span style={{ ...glyph, color: a.ghost }}>8</span>
              <span
                style={{
                  ...glyph,
                  color: ink,
                  textShadow: glow(!m.night, accent),
                }}
              >
                {d}
              </span>
              <div
                style={{
                  position: 'absolute',
                  left: 10,
                  top: 10,
                  width: 10,
                  height: 64,
                  borderRadius: 6,
                  background: `linear-gradient(180deg, ${WHITE(0.16)}, transparent)`,
                }}
              />
            </div>
            {i === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
                <span className="afx-blink" style={colonDot} />
                <span className="afx-blink" style={colonDot} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'relative',
          width: 336,
          height: 22,
          borderRadius: 6,
          background: a.base,
          boxShadow: `inset 0 1px 0 ${WHITE(0.12)}, 0 8px 18px ${a.baseShadow}`,
        }}
      >
        <span
          className="afx-breath"
          style={{
            position: 'absolute',
            right: 12,
            top: 8,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: accent,
            boxShadow: `0 0 8px ${accent}`,
          }}
        />
      </div>
      <EndLine m={m} px={15} style={{ marginTop: 16 }} />
    </div>
  );
}
