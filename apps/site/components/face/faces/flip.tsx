import type { CSSProperties } from 'react';
import { BLACK, SNOW, WHITE } from '../art';
import { EndLine, type IDrawProps, L, mono } from '../kit';

const TOP = { light: '#2A3550', night: '#232E4A' };
const BOTTOM = { light: '#1D273F', night: '#19213A' };

const sheen: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  height: 88,
  background: `linear-gradient(180deg, ${WHITE(0.06)}, transparent)`,
};
const hinge: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 87,
  height: 2,
  background: BLACK(0.55),
  boxShadow: `0 1px 0 ${WHITE(0.06)}`,
};
const dot = (accent: string): CSSProperties => ({
  display: 'block',
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: accent,
});

// Split-flap cards with a real hinge gap; the right card's top flap falls each second while awake.
export default function Flip({ m }: IDrawProps) {
  const { t, accent } = m;
  const top = m.night ? TOP.night : TOP.light;
  const bottom = m.night ? BOTTOM.night : BOTTOM.light;
  const card: CSSProperties = {
    position: 'relative',
    width: 140,
    height: 176,
    borderRadius: 16,
    background: `linear-gradient(180deg, ${top} 0 50%, ${bottom} 50% 100%)`,
    color: SNOW,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 116,
    fontWeight: 600,
    letterSpacing: '-0.05em',
    fontVariantNumeric: 'tabular-nums',
    boxShadow: `0 14px 28px ${BLACK(0.28)}, inset 0 1px 0 ${WHITE(0.08)}`,
    overflow: 'hidden',
  };
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 30,
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={card}>
          <div style={sheen} />
          <span style={{ position: 'relative' }}>{m.ga}</span>
          <div style={hinge} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <span className="afx-breath" style={dot(accent)} />
          <span className="afx-breath" style={dot(accent)} />
        </div>
        <div style={{ ...card, perspective: 600 }}>
          <div style={sheen} />
          <span style={{ position: 'relative' }}>{m.gb}</span>
          <div style={hinge} />
          <div
            className="afx-flap"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 140,
              height: 88,
              overflow: 'hidden',
              borderRadius: '16px 16px 0 0',
              background: top,
              transformOrigin: '50% 100%',
              opacity: m.liveOp,
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                width: 140,
                top: 0,
                height: 176,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: SNOW,
              }}
            >
              {m.gb}
            </span>
          </div>
        </div>
      </div>
      <div className={L} style={{ display: 'flex', gap: 140, ...mono(12, '.16em', t.ink2) }}>
        <span>{m.h > 0 ? 'HR' : 'MIN'}</span>
        <span>{m.h > 0 ? 'MIN' : 'SEC'}</span>
      </div>
      <EndLine m={m} px={15} />
    </div>
  );
}
