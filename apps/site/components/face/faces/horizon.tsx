import type { CSSProperties } from 'react';
import { CARD_SHADOW } from '../art';
import { alpha } from '../geometry';
import { big, EndLine, type IDrawProps, Stars, type TStar, PLATE } from '../kit';

const STARS: readonly TStar[] = [
  [30, 30, 3],
  [72, 58, 3],
  [118, 22, 3],
  [160, 70, 3],
  [96, 110, 3],
  [40, 96, 3],
  [186, 36, 3],
];
const SUN_HIGHLIGHT = { light: '#FFFFFF', night: '#E9FFF1' };
const SEA = {
  light: 'linear-gradient(180deg, #E6E6EF, #F1F1F7)',
  dark: 'linear-gradient(180deg, #0B1222, #0F1117)',
  oled: '#000000',
};

const shimmer = (left: number, top: number, width: number, accent: string): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width,
  height: 3,
  borderRadius: 2,
  background: accent,
});

// A lamp-sun sets toward the horizon as the session runs down.
export default function Horizon({ m }: IDrawProps) {
  const { accent, theme } = m;
  // The sun's centre runs from 122 px above the horizon at the start down onto it at the end.
  const sunTop = Math.round(184 - 32 - 122 * m.frac);
  const sky =
    theme === 'light'
      ? `linear-gradient(180deg, #F9EEDF 0%, #F6E1C8 70%, ${alpha(accent, 0x55)} 100%)`
      : theme === 'oled'
        ? `linear-gradient(180deg, #000000 30%, ${alpha(accent, 0x33)} 100%)`
        : `linear-gradient(180deg, #0A1226 0%, #16213D 65%, ${alpha(accent, 0x44)} 100%)`;
  return (
    <div
      className={PLATE}
      style={{
        position: 'absolute',
        left: 20,
        top: 8,
        width: 320,
        height: 300,
        overflow: 'hidden',
        borderRadius: 28,
        isolation: 'isolate',
        background: SEA[theme],
        boxShadow: CARD_SHADOW[theme],
      }}
    >
      <div
        style={{ position: 'absolute', left: 0, top: 0, width: 320, height: 184, overflow: 'hidden', background: sky }}
      >
        {m.night && <Stars pts={STARS} colors={['#FFFFFF']} step={0.5} />}
        <div
          className="af-tr"
          style={{
            position: 'absolute',
            left: 146,
            top: sunTop - 68,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(closest-side, ${alpha(accent, 0x73)}, ${alpha(accent, 0x2e)} 45%, transparent)`,
          }}
        />
        <div
          className="af-tr"
          style={{
            position: 'absolute',
            left: 214,
            top: sunTop,
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: `radial-gradient(circle at 40% 35%, ${m.night ? SUN_HIGHLIGHT.night : SUN_HIGHLIGHT.light}, ${accent} 70%)`,
            boxShadow: `0 0 0 10px ${alpha(accent, 0x26)}`,
          }}
        />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 183, height: 1, background: accent, opacity: 0.7 }} />
      <span className="afx-shim" style={shimmer(222, 192, 48, accent)} />
      <span className="afx-shim" data-delay="0.6" style={shimmer(230, 202, 32, accent)} />
      <span className="afx-shim" data-delay="1.2" style={shimmer(237, 212, 18, accent)} />
      <div style={{ position: 'absolute', left: 24, top: 196, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={big(m.long ? 44 : 56)}>{m.digits}</span>
        <EndLine m={m} px={14} />
      </div>
    </div>
  );
}
