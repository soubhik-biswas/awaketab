import type { CSSProperties } from 'react';
import { CARD_SHADOW, NAVY, type TThemed, WHITE } from '../art';
import { alpha } from '../geometry';
import { big, D, EndLine, type IDrawProps, Kicker, PLATE, Stars, type TStar } from '../kit';

// The horizon sits 184 down the 320 × 300 card; the sun's centre stands RISE above it at the start and on it at the end.
const HORIZON = 184;
const RISE = 122;
const SUN = 64;
const SUN_X = 246;
const STARS: readonly TStar[] = [
  [160, 20, 2],
  [196, 46, 1.5],
  [124, 58, 2],
  [64, 72, 1.5],
  [150, 96, 2],
  [300, 24, 1.5],
  [28, 112, 2],
];
const SKY: TThemed<string> = {
  light: 'linear-gradient(180deg, #D9E4F5 0%, #EAEEF5 42%, #F7E9DC 80%, #F4DAC2 100%)',
  dark: 'linear-gradient(180deg, #050915 0%, #0A1229 40%, #16203F 76%, #252C4D 100%)',
  oled: 'linear-gradient(180deg, #000000 55%, #06070D 100%)',
};
const SEA: TThemed<string> = {
  light: 'linear-gradient(180deg, #D3D9E6 0%, #E4E7EF 30%, #EEF0F5 100%)',
  dark: 'linear-gradient(180deg, #111934 0%, #0B1022 32%, #080B15 100%)',
  oled: '#000000',
};
const FAR_TONE: TThemed<string> = { light: '#D9CCC6', dark: '#151D36', oled: '#0A0C13' };
const NEAR_TONE: TThemed<string> = { light: '#C2B3AE', dark: '#0D1326', oled: '#05060A' };
// Two ranges of hills on the left, the far one paler, both clear of the sun's path on the right.
const FAR = 'M0 158 C26 150 48 145 74 151 C98 156 116 147 140 152 C162 157 178 168 198 184';
const NEAR = 'M0 168 C20 161 38 159 58 164 C80 170 100 172 128 184';
// The glitter path under the sun widens and spaces out toward the viewer: [top, width, height].
const GLINTS = [
  [190, 14, 1.5],
  [197, 22, 2],
  [206, 30, 2],
  [218, 38, 2.5],
  [233, 46, 3],
] as const;
const SCALE = [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
const SUN_HIGHLIGHT = { light: '#FFFFFF', night: '#E9FFF1' };

const mix = (c: string, pct: number, base: string): string => `color-mix(in srgb, ${c} ${pct}%, ${base})`;

const glint = (top: number, width: number, height: number, color: string): CSSProperties => ({
  position: 'absolute',
  left: SUN_X - width / 2,
  top,
  width,
  height,
  borderRadius: height,
  background: color,
  opacity: 0.55,
});

// A lamp-sun sets toward the horizon as the session runs down; its height above the sea is the time left.
export default function Horizon({ m }: IDrawProps) {
  const { accent, theme, night } = m;
  const q = m.indef ? 1 : m.ringFrac;
  const cy = HORIZON - RISE * q;
  const low = 1 - q;
  // The haze on the horizon and the sun's reflection warm up as the sun gets lower.
  const haze = `radial-gradient(75% 42% at ${((SUN_X / 320) * 100).toFixed(1)}% 100%, ${alpha(accent, Math.round((night ? 0x40 : 0x4d) + 0x30 * low))}, transparent 72%)`;
  const reflect = alpha(accent, Math.round(0x1f + 0x26 * low));
  const highlight = night ? SUN_HIGHLIGHT.night : SUN_HIGHLIGHT.light;
  const tick = night ? WHITE(0.32) : NAVY(0.3);
  let majors = '';
  let minors = '';
  for (const s of SCALE) {
    const y = (HORIZON - RISE * s).toFixed(1);
    if (s % 0.25 === 0) majors += `M300 ${y}H308`;
    else minors += `M304 ${y}H308`;
  }
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
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 320,
          height: HORIZON,
          overflow: 'hidden',
          background: `${haze}, ${SKY[theme]}`,
        }}
      >
        {night && <Stars pts={STARS} colors={['#FFFFFF']} step={0.5} />}
        <div
          className={`af-tr${m.live ? ' afx-breath' : ''}`}
          style={{
            position: 'absolute',
            left: SUN_X - 80,
            top: cy - 80,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: `radial-gradient(closest-side, ${alpha(accent, 0x59)}, ${alpha(accent, 0x1f)} 55%, transparent)`,
          }}
        />
        <div
          className="af-tr"
          style={{
            position: 'absolute',
            left: SUN_X - SUN / 2,
            top: cy - SUN / 2,
            width: SUN,
            height: SUN,
            borderRadius: '50%',
            background: `radial-gradient(circle at 38% 34%, ${highlight} 0%, ${mix(accent, 55, highlight)} 30%, ${accent} 68%, ${night ? mix(accent, 82, '#000000') : accent} 100%)`,
            boxShadow: night
              ? `0 0 0 6px ${alpha(accent, 0x1f)}, 0 0 22px 2px ${alpha(accent, 0x59)}`
              : `0 0 0 6px ${alpha(accent, 0x1a)}, 0 6px 18px ${alpha(accent, 0x33)}`,
          }}
        />
        <svg
          className={D}
          style={{ position: 'absolute', left: 0, top: 0 }}
          width={320}
          height={HORIZON}
          viewBox={`0 0 320 ${HORIZON}`}
          aria-hidden="true"
        >
          <path d={`${FAR} L0 ${HORIZON} Z`} style={{ fill: FAR_TONE[theme] }} />
          <path d={FAR} fill="none" strokeWidth="1" style={{ stroke: alpha(accent, 0x47) }} />
          <path d={`${NEAR} L0 ${HORIZON} Z`} style={{ fill: NEAR_TONE[theme] }} />
          {!m.indef && (
            <>
              <path d={majors} strokeWidth="1.5" style={{ stroke: tick }} />
              <path d={minors} strokeWidth="1" style={{ stroke: tick }} />
            </>
          )}
        </svg>
      </div>
      <div
        style={{
          position: 'absolute',
          left: SUN_X - 44,
          top: HORIZON + 1,
          width: 88,
          height: 300 - HORIZON - 1,
          background: `radial-gradient(50% 100% at 50% 0%, ${reflect}, transparent)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: HORIZON - 1,
          width: 320,
          height: 1,
          background: `linear-gradient(90deg, ${alpha(accent, 0x1a)}, ${alpha(accent, 0xb3)} 77%, ${alpha(accent, 0x1a)})`,
        }}
      />
      {GLINTS.map(([top, width, height], i) => (
        <span
          key={top}
          className={`afx-shim ${D}`}
          data-delay={(i * 0.5).toFixed(1)}
          style={glint(top, width, height, night ? mix(accent, 70, '#FFFFFF') : accent)}
        />
      ))}
      <Kicker m={m} style={{ position: 'absolute', left: 24, top: 20 }} />
      <div style={{ position: 'absolute', left: 24, top: 196, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ ...big(m.long ? 44 : 56), whiteSpace: 'nowrap' }}>{m.digits}</span>
        <EndLine m={m} px={14} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 320,
          height: 300,
          background: `linear-gradient(135deg, ${WHITE(night ? 0.045 : 0.3)}, transparent 38%)`,
        }}
      />
    </div>
  );
}
