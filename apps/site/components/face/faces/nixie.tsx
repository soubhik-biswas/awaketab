import type { CSSProperties } from 'react';
import { BLACK, WHITE } from '../art';
import { alpha } from '../geometry';
import { EndLine, type IDrawProps } from '../kit';

const TUBE = '#0A0D12';
const TUBE_LINE = '#2A3240';
const BASE = 'linear-gradient(180deg, #2A3140, #12161E)';

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
                backgroundColor: TUBE,
                border: `1px solid ${TUBE_LINE}`,
                overflow: 'hidden',
                backgroundImage: `radial-gradient(ellipse at 50% 18%, ${WHITE(0.1)}, transparent 60%), repeating-linear-gradient(60deg, ${WHITE(0.04)} 0 1px, transparent 1px 7px), repeating-linear-gradient(-60deg, ${WHITE(0.04)} 0 1px, transparent 1px 7px)`,
              }}
            >
              <span style={{ ...glyph, color: WHITE(0.05) }}>8</span>
              <span
                style={{
                  ...glyph,
                  color: ink,
                  textShadow: `0 0 4px ${accent}, 0 0 18px ${alpha(accent, 0x99)}, 0 0 40px ${alpha(accent, 0x40)}`,
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
          background: BASE,
          boxShadow: `inset 0 1px 0 ${WHITE(0.12)}, 0 8px 18px ${BLACK(0.35)}`,
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
