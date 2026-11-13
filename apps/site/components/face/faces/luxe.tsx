import { type CSSProperties, useId } from 'react';
import { BLACK, NAVY, type TThemed, WHITE } from '../art';
import { SERIF } from '../fonts';
import { f1, P, ticks } from '../geometry';
import { D, DialLabel, hand, type IDrawProps, L, lmin, MONO, Svg, windowAt } from '../kit';
import { Applied, band, Crystal, minutesSpan } from './analog-dial';

const NUMERALS = [
  ['12', 0],
  ['3', 90],
  ['6', 180],
  ['9', 270],
] as const;
const INDICES = ticks(104, 122, 12, (i) => i % 3 !== 0);
const RAIL = ticks(127, 134, 60, (i) => i % 5 !== 0);
const FIVES = ticks(125.5, 135.5, 12);
const DAUPHINE = 'polygon(50% 0, 100% 82%, 50% 100%, 0 82%)';

// A sunburst dial: fine radial lines, the two bright sectors a brushed sunburst throws, and a deep base. Midnight by
// night, silvered opaline by day, black lacquer in OLED.
const DIAL: TThemed<CSSProperties> = {
  light: {
    background: `repeating-conic-gradient(${NAVY(0.022)} 0 .75deg, transparent .75deg 1.5deg), conic-gradient(from 315deg, ${WHITE(0.75)}, transparent 16%, transparent 34%, ${NAVY(0.05)} 50%, transparent 66%, transparent 84%, ${WHITE(0.75)}), radial-gradient(circle at 50% 42%, #FBFBFD 0%, #EEEFF4 62%, #E1E3EB 100%)`,
    boxShadow: `inset 0 2px 6px ${NAVY(0.16)}, inset 0 -1px 0 #FFFFFF`,
  },
  dark: {
    background: `repeating-conic-gradient(${WHITE(0.028)} 0 .75deg, transparent .75deg 1.5deg), conic-gradient(from 315deg, ${WHITE(0.1)}, transparent 16%, transparent 34%, ${WHITE(0.05)} 50%, transparent 66%, transparent 84%, ${WHITE(0.1)}), radial-gradient(circle at 50% 42%, #1A2440 0%, #0F1528 60%, #080B16 100%)`,
    boxShadow: `inset 0 2px 6px ${BLACK(0.6)}, inset 0 -1px 0 ${WHITE(0.05)}`,
  },
  oled: { background: '#000000', boxShadow: 'inset 0 0 0 1px #141821' },
};
// Polished steel hands at night; blued steel on the silver dial.
const STEEL: TThemed<readonly [string, string]> = {
  light: ['#4566B0', '#1F3A7A'],
  dark: ['#F5F7FB', '#A7AFBF'],
  oled: ['#F5F7FB', '#A7AFBF'],
};
const CAP: TThemed<string> = {
  light: 'radial-gradient(circle at 35% 30%, #6A86C8, #1F3A7A 70%)',
  dark: 'radial-gradient(circle at 35% 30%, #FFFFFF, #A7AFBF 55%, #59627A)',
  oled: 'radial-gradient(circle at 35% 30%, #FFFFFF, #A7AFBF 55%, #59627A)',
};
const WINDOW: TThemed<CSSProperties> = {
  light: {
    background: '#FFFFFF',
    boxShadow: `inset 0 1.5px 3px ${NAVY(0.18)}, 0 0 0 1px #D4D4E2, 0 1px 0 #FFFFFF`,
  },
  dark: {
    background: '#070A12',
    boxShadow: `inset 0 1.5px 3px ${BLACK(0.7)}, 0 0 0 1px #262A35, 0 1px 0 ${WHITE(0.06)}`,
  },
  oled: { background: '#000000', boxShadow: '0 0 0 1px #1A2236' },
};

// A dress watch: sunburst dial, serif numerals and applied indices, a railway minute track and a sector lit from
// now to the end time.
export default function Luxe({ m }: IDrawProps) {
  const { t, accent } = m;
  const id = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  const glow = `af-lx-glow${id}`;
  const steel = STEEL[m.theme];
  const span = minutesSpan(m);
  const [ex, ey] = P(130.5, m.minDeg + span);
  const metal = `linear-gradient(90deg, ${steel[0]} 50%, ${steel[1]} 50%)`;
  // The shadow sits on the turning hand and the dauphine cut on its blade, so the cut cannot clip the shadow away.
  const lift = { filter: `drop-shadow(0 2px 2px ${m.night ? BLACK(0.5) : NAVY(0.25)})` };
  const blade = <span style={{ position: 'absolute', inset: 0, background: metal, clipPath: DAUPHINE }} />;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 39,
          top: 14,
          width: 282,
          height: 282,
          borderRadius: '50%',
          ...DIAL[m.theme],
        }}
      />
      <Svg>
        <defs>
          <radialGradient id={glow} gradientUnits="userSpaceOnUse" cx="180" cy="155" r="127">
            <stop offset=".3" style={{ stopColor: accent, stopOpacity: 0 }} />
            <stop offset="1" style={{ stopColor: accent, stopOpacity: m.night ? 0.34 : 0.24 }} />
          </radialGradient>
        </defs>
        {span > 0 && (
          <>
            <path d={band(40, 127, m.minDeg, span)} fill={`url(#${glow})`} />
            <path d={band(127, 134, m.minDeg, span)} opacity=".5" style={{ fill: accent }} />
          </>
        )}
        <g fill="none" strokeWidth=".8" opacity=".55" style={{ stroke: t.ink2 }}>
          <circle cx="180" cy="155" r="127" />
          <circle cx="180" cy="155" r="134" />
        </g>
        <path className={D} d={RAIL} strokeWidth=".9" opacity=".6" style={{ stroke: t.ink2 }} />
        <path d={FIVES} strokeWidth="1.6" opacity=".9" style={{ stroke: t.ink }} />
        <Applied m={m} d={INDICES} w={4} />
        {span > 0 && (
          <>
            <circle cx={f1(ex)} cy={f1(ey)} r="3.2" style={{ fill: accent }} />
            {m.live && (
              <circle
                className="afx-breath"
                cx={f1(ex)}
                cy={f1(ey)}
                r="6.5"
                fill="none"
                strokeWidth="1"
                style={{ stroke: accent }}
              />
            )}
          </>
        )}
      </Svg>
      {NUMERALS.map(([n, deg]) => (
        <DialLabel
          key={n}
          m={m}
          text={n}
          rr={108}
          deg={deg}
          fs={30}
          color={t.ink}
          extra={{ fontFamily: SERIF, fontWeight: 300, letterSpacing: '-0.02em', fontVariantNumeric: 'lining-nums' }}
        />
      ))}
      <div
        className={L}
        style={{
          ...windowAt(180, 204, 88, 28),
          gap: 7,
          borderRadius: 7,
          ...WINDOW[m.theme],
          fontFamily: MONO,
          fontSize: lmin(13),
          letterSpacing: '.02em',
          color: t.ink,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span
          className="afx-breath"
          style={{ flex: 'none', width: 6, height: 6, borderRadius: '50%', background: accent }}
        />
        {m.digits}
      </div>
      <div className="afx-h" style={hand(74, 0, 14, m.hourDeg, m.hourDeg0, 'none', lift)}>
        {blade}
      </div>
      <div className="afx-m" style={hand(116, 0, 11, m.minDeg, m.minDeg0, 'none', lift)}>
        {blade}
      </div>
      <div className="afx-s" style={hand(122, 28, 2, m.secDeg, m.secDeg0, accent)}>
        <span
          style={{
            position: 'absolute',
            left: -4,
            top: 134,
            width: 10,
            height: 10,
            borderRadius: '50%',
            border: `2px solid ${accent}`,
            background: t.panel,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 174,
          top: 149,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: CAP[m.theme],
          boxShadow: `0 1px 2px ${BLACK(0.45)}`,
        }}
      />
      <Crystal m={m} />
    </>
  );
}
