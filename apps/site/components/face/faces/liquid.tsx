import { BLACK, NAVY, WHITE } from '../art';
import { alpha, f1 } from '../geometry';
import { D, type IDrawProps, Kicker, L, lmin, PLATE, digitSize } from '../kit';

// A clear glass sphere with a pastel fill and ink digits by day; a dark sphere of light at night.
const ART = {
  light: {
    glass: 'radial-gradient(circle at 36% 28%, #FFFFFF 0%, #F5F7FC 48%, #E5EAF4 100%)',
    drop: `0 0 0 1px #D9DEEA, 0 26px 50px -22px ${NAVY(0.24)}`,
    // The glass wall: a bright rim, light caught at the top left, a soft shade at the lower right.
    rim: `inset 0 0 0 1.5px ${WHITE(0.95)}, inset 12px 16px 28px -14px ${WHITE(0.95)}, inset -16px -22px 40px -18px ${NAVY(0.16)}`,
    gloss: `radial-gradient(circle 5px at 31% 21%, ${WHITE(0.95)}, ${WHITE(0)}), radial-gradient(34% 17% at 36% 17%, ${WHITE(0.75)}, ${WHITE(0)}), radial-gradient(36% 12% at 58% 91%, ${WHITE(0.55)}, ${WHITE(0)})`,
    bubble: NAVY(0.2),
    tick: NAVY(0.22),
    ink: '#0B1020',
    ink2: '#2E3346',
    textShadow: `0 1px 0 ${WHITE(0.5)}`,
  },
  night: {
    glass: 'radial-gradient(circle at 50% 35%, #18213D, #070B18 75%)',
    drop: `0 26px 56px -20px ${BLACK(0.6)}`,
    rim: `inset 0 0 0 1.5px ${WHITE(0.08)}, inset 12px 16px 28px -14px ${WHITE(0.14)}, inset -18px -24px 44px -16px ${BLACK(0.55)}`,
    gloss: `radial-gradient(circle 5px at 31% 21%, ${WHITE(0.7)}, ${WHITE(0)}), radial-gradient(34% 17% at 36% 17%, ${WHITE(0.2)}, ${WHITE(0)}), radial-gradient(36% 12% at 58% 91%, ${WHITE(0.1)}, ${WHITE(0)})`,
    bubble: WHITE(0.42),
    tick: WHITE(0.2),
    ink: '#FFFFFF',
    ink2: WHITE(0.9),
    textShadow: `0 2px 16px ${BLACK(0.4)}`,
  },
} as const;
const CRESTS = Array.from({ length: 17 }, (_, k) => ` Q${k * 32 + 16} ${k % 2 ? 14 : 2} ${k * 32 + 32} 8`).join('');
const CREST = `M0 8${CRESTS}`;
const WAVE = `${CREST} L520 16 L0 16 Z`;
// Each bubble starts at least its 150 px rise below the surface, so it fades out before it reaches the air.
const BUBBLES = [
  { left: 70, top: 154, d: 8, delay: 0 },
  { left: 160, top: 176, d: 6, delay: -2 },
  { left: 120, top: 198, d: 10, delay: -3.4 },
] as const;
const R = 130;
// Graduations at a quarter, a half and three quarters full, set into the right wall of the glass.
const GRADS = [0.75, 0.5, 0.25]
  .map((q) => {
    const y = 2 * R * (1 - q);
    const x = R + Math.sqrt(R * R - (y - R) ** 2);
    return `M${f1(x - 18)} ${f1(y)}H${f1(x - 9)}`;
  })
  .join('');
const NIGHT_GLASS = '#070B18';
const deep = (c: string, pct: number): string => `color-mix(in srgb, ${c} ${pct}%, ${NIGHT_GLASS})`;
const pale = (c: string, pct: number): string => `color-mix(in srgb, ${c} ${pct}%, #FFFFFF)`;

// A glass sphere of light that drains as the session runs, with a lit surface, waves and bubbles.
export default function Liquid({ m }: IDrawProps) {
  const light = !m.night;
  const a = light ? ART.light : ART.night;
  const hc = m.heat(m.frac);
  // At night the liquid is a deep glow of its colour, so the white digits keep their contrast where they cross it.
  const crest = light ? pale(hc, 24) : deep(hc, 52);
  const meniscus = light ? WHITE(0.95) : pale(hc, 45);
  const fill = light
    ? `radial-gradient(70% 26px at 38% 0%, ${WHITE(0.55)}, ${WHITE(0)}), linear-gradient(180deg, ${pale(hc, 30)}, ${pale(hc, 38)} 45%, ${pale(hc, 48)})`
    : `radial-gradient(70% 26px at 38% 0%, ${alpha(hc, 0x40)}, transparent), linear-gradient(180deg, ${deep(hc, 44)}, ${deep(hc, 36)} 55%, ${deep(hc, 28)})`;
  // Empty drops the surface below the glass too, so no wave is left showing at the bottom.
  const empty = m.ringFrac <= 0;
  const level = empty ? 280 : Math.round(2 * R * (1 - m.ringFrac));
  // A soft contact shadow, tinted by the light the liquid throws while there is any.
  const floor = light ? NAVY(0.16) : empty ? BLACK(0.5) : alpha(hc, 0x33);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 268,
          width: 168,
          height: 22,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${floor}, transparent)`,
        }}
      />
      <div
        className={PLATE}
        style={{
          position: 'absolute',
          left: 50,
          top: 16,
          width: 2 * R,
          height: 2 * R,
          borderRadius: '50%',
          overflow: 'hidden',
          isolation: 'isolate',
          background: a.glass,
          boxShadow: a.drop,
        }}
      >
        <div
          className="af-tr"
          style={{ position: 'absolute', left: 0, width: 2 * R, top: level, height: 280, background: fill }}
        >
          <svg
            className="afx-wl2"
            style={{ position: 'absolute', left: -64, top: -12, opacity: 0.5 }}
            width="520"
            height="16"
            viewBox="0 0 520 16"
            aria-hidden="true"
          >
            <path d={WAVE} style={{ fill: crest }} />
          </svg>
          <svg
            className="afx-wl"
            style={{ position: 'absolute', left: 0, top: -14 }}
            width="520"
            height="16"
            viewBox="0 0 520 16"
            aria-hidden="true"
          >
            <path d={WAVE} style={{ fill: crest }} />
            <path d={CREST} fill="none" strokeWidth="1.2" strokeLinecap="round" style={{ stroke: meniscus }} />
          </svg>
          {BUBBLES.map((b) => (
            <span
              key={b.left}
              className={`afx-rise ${D}`}
              data-delay={b.delay}
              style={{
                position: 'absolute',
                left: b.left,
                top: b.top,
                width: b.d,
                height: b.d,
                borderRadius: '50%',
                border: `1px solid ${a.bubble}`,
                background: `radial-gradient(circle at 35% 30%, ${WHITE(0.75)}, ${WHITE(0)} 45%)`,
              }}
            />
          ))}
        </div>
        <svg
          className={D}
          style={{ position: 'absolute', left: 0, top: 0 }}
          width={2 * R}
          height={2 * R}
          viewBox={`0 0 ${2 * R} ${2 * R}`}
          aria-hidden="true"
        >
          <path d={GRADS} fill="none" strokeWidth="1.2" strokeLinecap="round" style={{ stroke: a.tick }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: a.gloss, boxShadow: a.rim }} />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 2 * R,
            height: 2 * R,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            color: a.ink,
            textShadow: a.textShadow,
          }}
        >
          <Kicker m={m} color={a.ink2} />
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
          <span className={L} style={{ fontSize: lmin(14), color: a.ink2 }}>
            {m.endLine}
          </span>
        </div>
      </div>
    </>
  );
}
