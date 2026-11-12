import { f1, pad } from '../geometry';
import { card, DISPLAY, type IDrawProps, L, lmin, MONO, PLATE } from '../kit';

const ART = {
  light: { ground: '#F3EEE3', disc: '#1A1C24', square: '#6633F5', semi: '#E8B931', ink: '#1A1C24' },
  night: { ground: '#14161F', disc: '#2A2F42', square: '#9F7BFF', semi: '#FFC53D', ink: '#F1F1F5' },
};

// The pie of time left on the disc (r 88 around 112, 132), starting at 12.
export const bauhausPie = (deg: number): string => {
  if (deg <= 0.05) return '';
  if (deg >= 359.9) return 'M112 44 A88 88 0 1 1 111.9 44 Z';
  const q = ((deg - 90) * Math.PI) / 180;
  return `M112 132 L112 44 A88 88 0 ${deg > 180 ? 1 : 0} 1 ${f1(112 + 88 * Math.cos(q))} ${f1(132 + 88 * Math.sin(q))} Z`;
};

// Primary shapes and a pie of time left: a design object on the desk.
export default function Bauhaus({ m }: IDrawProps) {
  const a = m.night ? ART.night : ART.light;
  const unitA = m.h > 0 ? 'HR' : 'MIN';
  const unitB = m.h > 0 ? 'MIN' : 'SEC';
  // The readout has 100 px between x 216 and the card's edge; a digit advances about 0.62 em, the h about 0.6 em.
  const em = m.h > 0 ? String(m.h).length * 0.62 + 0.6 : 1.24;
  const fs = Math.min(m.h > 9 ? 48 : m.h > 0 ? 60 : 76, Math.floor(100 / em));
  return (
    <div className={PLATE} style={card(m, { background: a.ground })}>
      <svg
        style={{ position: 'absolute', left: 0, top: 0 }}
        width="332"
        height="282"
        viewBox="0 0 332 282"
        aria-hidden="true"
      >
        <circle cx="112" cy="132" r="88" fill={a.disc} />
        <path className="af-tr" d={bauhausPie(360 * m.ringFrac)} style={{ fill: m.accent }} />
        <circle cx="112" cy="132" r="10" fill={a.ground} />
        <rect x="248" y="22" width="56" height="56" fill={a.square} />
        <path d="M262 282 A44 44 0 0 1 350 282 Z" fill={a.semi} />
      </svg>
      <div
        style={{ position: 'absolute', left: 216, top: 100, display: 'flex', flexDirection: 'column', color: a.ink }}
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
        <span className={L} style={{ fontFamily: MONO, fontSize: lmin(12), letterSpacing: '.14em', marginTop: 6 }}>
          {unitA} · {unitB}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 24,
          bottom: 9,
          width: 228,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          color: a.ink,
        }}
      >
        <span style={{ display: 'block', width: 150, height: 10, background: a.ink }} />
        <span className={L} style={{ fontFamily: MONO, fontSize: lmin(12), lineHeight: 1.2 }}>
          {m.endLine}
        </span>
      </div>
    </div>
  );
}
