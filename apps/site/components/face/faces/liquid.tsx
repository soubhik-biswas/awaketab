import { BLACK, NAVY, WHITE } from '../art';
import { alpha } from '../geometry';
import { digitSize, type IDrawProps, L, lmin, MONO, PLATE } from '../kit';

// A clear glass sphere with a pastel fill and ink digits by day; a dark sphere of light at night.
const ART = {
  light: {
    glass: 'radial-gradient(circle at 50% 35%, #FFFFFF, #E2E7F1 75%)',
    shadow: `inset 0 0 0 2px ${WHITE(0.9)}, inset 0 -20px 50px ${NAVY(0.08)}, 0 26px 60px ${NAVY(0.14)}`,
    bubble: NAVY(0.25),
    ink: '#0B1020',
    textShadow: 'none',
  },
  night: {
    glass: 'radial-gradient(circle at 50% 35%, #18213D, #070B18 75%)',
    shadow: `inset 0 0 0 2px ${WHITE(0.08)}, inset 0 -20px 50px ${BLACK(0.5)}, 0 26px 60px ${BLACK(0.45)}`,
    bubble: WHITE(0.45),
    ink: '#FFFFFF',
    textShadow: `0 2px 16px ${BLACK(0.35)}`,
  },
};
const CRESTS = Array.from({ length: 17 }, (_, k) => ` Q${k * 32 + 16} ${k % 2 ? 14 : 2} ${k * 32 + 32} 8`).join('');
const WAVE = `M0 8${CRESTS} L520 16 L0 16 Z`;
const BUBBLES = [
  { left: 70, top: 120, d: 8, delay: 0 },
  { left: 160, top: 150, d: 6, delay: -2 },
  { left: 120, top: 170, d: 10, delay: -3.4 },
] as const;

// A glass sphere of light that drains as the session runs, with waves and bubbles.
export default function Liquid({ m }: IDrawProps) {
  const light = !m.night;
  const a = light ? ART.light : ART.night;
  const hc = m.heat(m.frac);
  const crest = light ? alpha(hc, 0x8c) : hc;
  const fill = light
    ? `linear-gradient(180deg, ${alpha(hc, 0x73)}, ${alpha(hc, 0x4d)} 60%, ${alpha(hc, 0x40)})`
    : `linear-gradient(180deg, ${hc}, ${alpha(hc, 0xb3)} 60%, ${alpha(hc, 0x80)})`;
  const level = Math.round(260 * (1 - m.ringFrac));
  return (
    <div
      className={PLATE}
      style={{
        position: 'absolute',
        left: 50,
        top: 16,
        width: 260,
        height: 260,
        borderRadius: '50%',
        overflow: 'hidden',
        isolation: 'isolate',
        background: a.glass,
        boxShadow: `${a.shadow}, 0 0 0 1px ${m.t.line}`,
      }}
    >
      <div
        className="af-tr"
        style={{
          position: 'absolute',
          left: 0,
          width: 260,
          top: level,
          height: 280,
          background: fill,
        }}
      >
        <svg
          className="afx-wl"
          style={{ position: 'absolute', left: 0, top: -14 }}
          width="520"
          height="16"
          viewBox="0 0 520 16"
          aria-hidden="true"
        >
          <path d={WAVE} style={{ fill: crest }} />
        </svg>
        <svg
          className="afx-wl2"
          style={{ position: 'absolute', left: -64, top: -10, opacity: 0.55 }}
          width="520"
          height="16"
          viewBox="0 0 520 16"
          aria-hidden="true"
        >
          <path d={WAVE} style={{ fill: crest }} />
        </svg>
        {BUBBLES.map((b) => (
          <span
            key={b.left}
            className="afx-rise"
            data-delay={b.delay}
            style={{
              position: 'absolute',
              left: b.left,
              top: b.top,
              width: b.d,
              height: b.d,
              borderRadius: '50%',
              border: `1.5px solid ${a.bubble}`,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 38,
          top: 22,
          width: 120,
          height: 60,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${WHITE(0.22)}, transparent)`,
          transform: 'rotate(-24deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 260,
          height: 260,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          color: a.ink,
          textShadow: a.textShadow,
        }}
      >
        <span
          className={L}
          style={{
            fontFamily: MONO,
            fontSize: lmin(12),
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          {m.topWord}
        </span>
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
        <span className={L} style={{ fontSize: lmin(14), opacity: 0.9 }}>
          {m.endLine}
        </span>
      </div>
    </div>
  );
}
