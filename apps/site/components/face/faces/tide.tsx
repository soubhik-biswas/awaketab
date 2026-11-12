import { useId } from 'react';
import { BLACK, NAVY, WHITE } from '../art';
import { alpha } from '../geometry';
import { big, EndLine, fit, type IDrawProps, L, lmin, MONO, PLATE } from '../kit';

const GLASS = {
  light: 'linear-gradient(90deg, #FFFFFF, #EFEFF6)',
  dark: 'linear-gradient(90deg, #121A2E, #0F1117)',
  oled: '#000000',
};
const SCALE = [0, 0.25, 0.5, 0.75, 1];
// The glass is 290 tall at 10; a full glass stops 22 below its rim so the wave crest stays inside.
const GLASS_TOP = 10;
const GLASS_H = 290;
const WATER_MAX = 268;
// Ten 44 px half-waves: the loop moves 176 px, so 440 px keeps the 240 px glass covered at every step.
const crest = (y: number, dy: number): string =>
  `M0 ${y} Q22 ${y + dy} 44 ${y}${Array.from({ length: 9 }, (_, i) => ` T${(i + 2) * 44} ${y}`).join('')}`;
const WAVE_W = 440;
const BODY_H = 14 + GLASS_H;
const mark = (total: number, q: number): string =>
  total >= 7200
    ? q === 0
      ? '0'
      : `${Number(((total / 3600) * q).toFixed(1))}h`
    : String(Math.round((total / 60) * q));
const BUBBLES = [
  { left: 40, bottom: 10, d: 6, delay: 0 },
  { left: 112, bottom: 4, d: 8, delay: 1.6 },
  { left: 76, bottom: 16, d: 5, delay: 3 },
];

// The water level is the time left. Calm and glanceable.
export default function Tide({ m }: IDrawProps) {
  const { t, accent, theme } = m;
  const grad = `af-td${useId().replace(/[^a-zA-Z0-9_-]/gu, '')}`;
  const a1 = alpha(accent, m.night ? 0x26 : 0x38);
  const a2 = alpha(accent, m.night ? 0x40 : 0x5c);
  const water = Math.round(WATER_MAX * m.frac);
  const shadow =
    theme === 'light'
      ? `inset 0 0 0 2px ${t.line}, 0 16px 30px ${NAVY(0.1)}`
      : `inset 0 0 0 2px ${t.line}, 0 18px 36px ${BLACK(0.4)}`;
  return (
    <>
      <div
        className={PLATE}
        style={{
          position: 'absolute',
          left: 60,
          top: GLASS_TOP,
          width: 240,
          height: GLASS_H,
          borderRadius: 52,
          overflow: 'hidden',
          isolation: 'isolate',
          background: GLASS[theme],
          boxShadow: shadow,
        }}
      >
        {water > 0 && (
          <div className="af-tr" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: water }}>
            <svg
              className="afx-wave"
              style={{ position: 'absolute', left: 0, top: -14 }}
              width={WAVE_W}
              height={BODY_H}
              viewBox={`0 0 ${WAVE_W} ${BODY_H}`}
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" style={{ stopColor: a2 }} />
                  <stop offset="1" style={{ stopColor: a1 }} />
                </linearGradient>
              </defs>
              <path d={`${crest(9, -9)} V${BODY_H} H0 Z`} fill={`url(#${grad})`} />
            </svg>
            <svg
              className="afx-wave2"
              style={{ position: 'absolute', left: 0, top: -10 }}
              width={WAVE_W}
              height="14"
              viewBox={`0 0 ${WAVE_W} 14`}
              aria-hidden="true"
            >
              <path d={crest(7, 7)} fill="none" strokeWidth="2.5" opacity=".45" style={{ stroke: accent }} />
            </svg>
            {m.live && (
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                {BUBBLES.map((b) => (
                  <span
                    key={b.left}
                    className="afx-rise"
                    data-delay={b.delay}
                    style={{
                      position: 'absolute',
                      left: b.left,
                      bottom: b.bottom,
                      width: b.d,
                      height: b.d,
                      borderRadius: '50%',
                      border: `1.5px solid ${accent}`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            left: 14,
            top: 18,
            width: 14,
            height: 120,
            borderRadius: 7,
            background: `linear-gradient(180deg, ${WHITE(0.22)}, transparent)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span style={big(fit(m, m.long ? 40 : 54, 36))}>{m.digits}</span>
          <EndLine m={m} px={14} />
        </div>
      </div>
      {!m.indef &&
        m.total > 0 &&
        SCALE.map((q) => (
          <span
            key={q}
            className={L}
            style={{
              position: 'absolute',
              left: 306,
              top: Math.round(GLASS_TOP + GLASS_H - WATER_MAX * q - 8),
              lineHeight: '16px',
              whiteSpace: 'nowrap',
              fontFamily: MONO,
              fontSize: lmin(12),
              color: t.ink2,
            }}
          >
            {mark(m.total, q)}
          </span>
        ))}
    </>
  );
}
