import type { CSSProperties } from 'react';
import { BLACK, NAVY, WHITE } from '../art';
import { EndLine, type IDrawProps, L, mono } from '../kit';

// Porcelain cards by day, graphite cards at night.
const TOP = { light: '#FFFFFF', night: '#252935' };
const BOTTOM = { light: '#EEF0F6', night: '#1A1D26' };
const SHADOW = {
  light: `0 14px 28px ${NAVY(0.12)}, inset 0 0 0 1px #D6D9E3, inset 0 1px 0 #FFFFFF`,
  night: `0 14px 28px ${BLACK(0.28)}, inset 0 1px 0 ${WHITE(0.08)}`,
};

const sheen: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  height: 84,
  background: `linear-gradient(180deg, ${WHITE(0.06)}, transparent)`,
};
const hinge = (light: boolean): CSSProperties => ({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 87,
  height: 2,
  background: light ? NAVY(0.16) : BLACK(0.55),
  boxShadow: `0 1px 0 ${light ? '#FFFFFF' : WHITE(0.06)}`,
});
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
  const k = m.night ? 'night' : 'light';
  const top = TOP[k];
  const split = hinge(!m.night);
  const card: CSSProperties = {
    position: 'relative',
    width: 136,
    height: 168,
    borderRadius: 18,
    background: `linear-gradient(180deg, ${top} 0 50%, ${BOTTOM[k]} 50% 100%)`,
    color: t.cardInk,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 98,
    fontWeight: 600,
    letterSpacing: '-0.04em',
    fontVariantNumeric: 'tabular-nums',
    boxShadow: SHADOW[k],
    overflow: 'hidden',
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
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={card}>
          <div style={sheen} />
          <span style={{ position: 'relative' }}>{m.ga}</span>
          <div style={split} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <span className="afx-breath" style={dot(accent)} />
          <span className="afx-breath" style={dot(accent)} />
        </div>
        <div style={{ ...card, perspective: 600 }}>
          <div style={sheen} />
          <span style={{ position: 'relative' }}>{m.gb}</span>
          <div style={split} />
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
                color: t.cardInk,
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
