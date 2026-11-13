import { BLACK, NAVY, WHITE } from '../art';
import { f1, pad, ticks } from '../geometry';
import { card, D, DISPLAY, type IDrawProps, L, lmin, MONO, PLATE } from '../kit';
import type { TFaceTheme } from '../model';

// Printed paper by day; at night the same print on deep ink, and on true black for OLED.
const ART: Readonly<
  Record<TFaceTheme, { ground: string; disc: string; square: string; semi: string; ink: string; light: string }>
> = {
  light: {
    ground: '#F3EEE3',
    disc: '#1A1C24',
    square: '#6633F5',
    semi: '#E8B931',
    ink: '#1A1C24',
    light: `radial-gradient(110% 90% at 0% 0%, ${WHITE(0.55)}, transparent 60%), linear-gradient(135deg, transparent 55%, ${NAVY(0.04)})`,
  },
  dark: {
    ground: '#14161F',
    disc: '#2A2F42',
    square: '#9F7BFF',
    semi: '#F2BE3A',
    ink: '#F1F1F5',
    light: `radial-gradient(110% 90% at 0% 0%, ${WHITE(0.045)}, transparent 60%), linear-gradient(135deg, transparent 55%, ${BLACK(0.25)})`,
  },
  oled: {
    ground: '#000000',
    disc: '#1C2030',
    square: '#9F7BFF',
    semi: '#F2BE3A',
    ink: '#F1F1F5',
    light: 'none',
  },
};
// Each shape is a cut-out laid on the paper, so it casts a small shadow down and right.
const LIFT: Readonly<Record<TFaceTheme, string | undefined>> = {
  light: `drop-shadow(1px 2px 1.5px ${NAVY(0.16)})`,
  dark: `drop-shadow(1px 2px 2px ${BLACK(0.45)})`,
  oled: undefined,
};

// The disc: r 88 around 112, 132 on the 332 × 282 card, with a 24 px margin to the left.
const DX = 112;
const DY = 132;
const HOURS = ticks(72, 82, 12, () => true, DX, DY);
const MINUTES = ticks(78, 82, 60, (i) => i % 5 !== 0, DX, DY);

// The pie of time left on the disc, starting at 12.
export const bauhausPie = (deg: number): string => {
  if (deg <= 0.05) return '';
  if (deg >= 359.9) return 'M112 44 A88 88 0 1 1 111.9 44 Z';
  const q = ((deg - 90) * Math.PI) / 180;
  return `M112 132 L112 44 A88 88 0 ${deg > 180 ? 1 : 0} 1 ${f1(112 + 88 * Math.cos(q))} ${f1(132 + 88 * Math.sin(q))} Z`;
};

// Circle, square, triangle and a pie of time left: a design object on the desk.
export default function Bauhaus({ m }: IDrawProps) {
  const a = ART[m.theme];
  const unitA = m.h > 0 ? 'HR' : 'MIN';
  const unitB = m.h > 0 ? 'MIN' : 'SEC';
  // The readout has 100 px between x 216 and the card's edge; a digit advances about 0.62 em, the h about 0.6 em.
  const em = m.h > 0 ? String(m.h).length * 0.62 + 0.6 : 1.24;
  const fs = Math.min(m.h > 9 ? 48 : m.h > 0 ? 60 : 76, Math.floor(100 / em));
  return (
    <div className={PLATE} style={card(m, { background: `${a.light === 'none' ? '' : `${a.light}, `}${a.ground}` })}>
      <svg
        style={{ position: 'absolute', left: 0, top: 0 }}
        width="332"
        height="282"
        viewBox="0 0 332 282"
        aria-hidden="true"
      >
        <g style={{ filter: LIFT[m.theme] }}>
          <circle cx={DX} cy={DY} r="88" fill={a.disc} />
          <path className="af-tr" d={bauhausPie(360 * m.ringFrac)} style={{ fill: m.accent }} />
          <rect x="252" y="24" width="56" height="56" fill={a.square} />
          <path d="M264 282 A44 44 0 0 1 352 282 Z" fill={a.semi} />
          <path d="M104 28 H120 L112 41.9 Z" fill={a.ink} />
        </g>
        <path className={D} d={MINUTES} fill="none" stroke={a.ground} strokeOpacity=".32" strokeWidth="1" />
        <path d={HOURS} fill="none" stroke={a.ground} strokeOpacity=".6" strokeWidth="2.4" />
        <circle cx={DX} cy={DY} r="10" fill={a.ground} />
        <circle cx={DX} cy={DY} r="3.5" fill={a.disc} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 216,
          bottom: 62,
          display: 'flex',
          flexDirection: 'column',
          color: a.ink,
        }}
      >
        <span
          style={{
            fontFamily: DISPLAY,
            fontStretch: '112%',
            fontSize: fs,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 0.86,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.h > 0 ? `${m.h}h` : pad(m.m)}
        </span>
        <span
          style={{
            fontFamily: DISPLAY,
            fontStretch: '112%',
            fontSize: 40,
            fontWeight: 300,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: m.accent,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.h > 0 ? pad(m.m) : pad(m.s)}
        </span>
        <span
          className={L}
          style={{ fontFamily: MONO, fontSize: lmin(12), letterSpacing: '.14em', lineHeight: 1.2, marginTop: 8 }}
        >
          {unitA} · {unitB}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 24,
          bottom: 16,
          width: 228,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          color: a.ink,
        }}
      >
        <span style={{ display: 'block', width: 176, height: 10, background: a.ink }} />
        <span className={L} style={{ fontFamily: MONO, fontSize: lmin(12), lineHeight: 1.2 }}>
          {m.endLine}
        </span>
      </div>
    </div>
  );
}
