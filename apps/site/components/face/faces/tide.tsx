import { BLACK, NAVY, WHITE } from '../art';
import { alpha } from '../geometry';
import { big, EndLine, fit, type IDrawProps, L, lmin, MONO, PLATE } from '../kit';

const GLASS = {
  light: 'linear-gradient(90deg, #FFFFFF, #EFEFF6)',
  dark: 'linear-gradient(90deg, #121A2E, #0F1117)',
  oled: '#000000',
};
const SCALE = [0, 0.25, 0.5, 0.75, 1];
const BUBBLES = [
  { left: 40, bottom: 10, d: 6, delay: 0 },
  { left: 112, bottom: 4, d: 8, delay: 1.6 },
  { left: 76, bottom: 16, d: 5, delay: 3 },
];

// The water level is the time left. Calm and glanceable.
export default function Tide({ m }: IDrawProps) {
  const { t, accent, theme } = m;
  const a1 = alpha(accent, 0x26);
  const a2 = alpha(accent, 0x40);
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
          top: 10,
          width: 240,
          height: 290,
          borderRadius: 52,
          overflow: 'hidden',
          isolation: 'isolate',
          background: GLASS[theme],
          boxShadow: shadow,
        }}
      >
        <div
          className="af-tr"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: Math.round(286 * m.frac),
            background: `linear-gradient(180deg, ${a2}, ${a1})`,
          }}
        >
          <svg
            className="afx-wave"
            style={{ position: 'absolute', left: 0, top: -14 }}
            width="352"
            height="18"
            viewBox="0 0 352 18"
            aria-hidden="true"
          >
            <path d="M0 9 Q22 0 44 9 T88 9 T132 9 T176 9 T220 9 T264 9 T308 9 T352 9 V18 H0 Z" style={{ fill: a2 }} />
          </svg>
          <svg
            className="afx-wave2"
            style={{ position: 'absolute', left: 0, top: -10 }}
            width="352"
            height="14"
            viewBox="0 0 352 14"
            aria-hidden="true"
          >
            <path
              d="M0 7 Q22 14 44 7 T88 7 T132 7 T176 7 T220 7 T264 7 T308 7 T352 7 V14 H0 Z"
              opacity=".35"
              style={{ fill: accent }}
            />
          </svg>
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
      {SCALE.map((q) => (
        <span
          key={q}
          className={L}
          style={{
            position: 'absolute',
            left: 254,
            width: 30,
            textAlign: 'right',
            top: Math.round(Math.min(276, Math.max(18, 296 - 286 * q - 8))),
            fontFamily: MONO,
            fontSize: lmin(12),
            color: t.ink2,
            opacity: 0.8,
          }}
        >
          {Math.round((m.total / 60) * q)}
        </span>
      ))}
    </>
  );
}
