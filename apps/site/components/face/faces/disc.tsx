import type { CSSProperties } from 'react';
import { BLACK, NAVY, type TThemed, WHITE } from '../art';
import { alpha, f1, P, ticks } from '../geometry';
import { DialLabel, fit, type IDrawProps, L, MONO, lmin, Svg } from '../kit';
import { Applied, Crystal } from './analog-dial';

// The well the disc turns in, sunk into the dial: shadow on its top-left wall, light on the bottom-right lip.
const WELL: TThemed<CSSProperties> = {
  light: {
    background: 'radial-gradient(circle at 50% 35%, #EDEDF4, #E3E3EC)',
    boxShadow: `inset 1px 3px 7px ${NAVY(0.16)}, inset -1px -1px 0 ${WHITE(0.9)}`,
  },
  dark: {
    background: 'radial-gradient(circle at 50% 35%, #0D0E14, #07080C)',
    boxShadow: `inset 1px 3px 8px ${BLACK(0.75)}, inset -1px -1px 0 ${WHITE(0.05)}`,
  },
  oled: { background: '#0A0E18', boxShadow: `inset -1px -1px 0 ${WHITE(0.05)}` },
};
// The hub over the centre: porcelain by day, a dark lacquered cap at night.
const HUB: TThemed<CSSProperties> = {
  light: {
    background: 'radial-gradient(circle at 36% 28%, #FFFFFF, #F4F4F9 60%, #E9E9F1)',
    border: '1px solid #D9D9E5',
    boxShadow: `0 10px 24px ${NAVY(0.18)}, 0 2px 4px ${NAVY(0.1)}, inset 0 1px 0 #FFFFFF, inset 0 -3px 8px ${NAVY(0.06)}`,
  },
  dark: {
    background: 'radial-gradient(circle at 36% 28%, #262A36, #13151C 62%, #0B0C11)',
    border: '1px solid #2A2D38',
    boxShadow: `0 14px 30px ${BLACK(0.5)}, 0 2px 6px ${BLACK(0.4)}, inset 0 1px 0 ${WHITE(0.12)}, inset 0 -3px 8px ${BLACK(0.4)}`,
  },
  oled: { background: '#05070C', border: '1px solid #16181F' },
};
// Anodised metal: fine turned grooves and a reflection along the light's axis, over the heat colour.
const GROOVES = `repeating-radial-gradient(circle, ${WHITE(0.07)} 0, transparent 1.5px, ${WHITE(0.07)} 3px)`;
const SHEEN = (night: boolean): string => {
  const hi = WHITE(night ? 0.16 : 0.22);
  const lo = BLACK(night ? 0.14 : 0.08);
  return `conic-gradient(transparent, ${lo} 45deg, transparent 90deg, ${hi} 135deg, transparent 180deg, ${lo} 225deg, transparent 270deg, ${hi} 315deg, transparent)`;
};
const GLOSS = `radial-gradient(ellipse 80% 60% at 32% 20%, ${WHITE(0.22)}, transparent 62%)`;
const MINOR = ticks(109.5, 114, 60, (i) => i % 5 !== 0);
const MAJOR = ticks(108, 115, 12, (i) => i % 3 !== 0);
const QUARTER = ticks(107, 116, 12, (i) => i % 3 === 0);

// A solid disc that shrinks toward 12, in one heat colour: green, then lime, amber and ember.
export default function Disc({ m }: IDrawProps) {
  const { t } = m;
  const deg = 360 * m.ringFrac;
  const hc = m.heat(m.frac);
  const discFill = `radial-gradient(circle at 50% 30%, ${alpha(hc, 0xf2)}, ${hc} 70%, ${alpha(hc, 0xcc)} 100%)`;
  const mask = `conic-gradient(#000 0deg ${deg.toFixed(2)}deg, transparent ${deg.toFixed(2)}deg 360deg)`;
  const [ex, ey] = P(103, deg);
  const edge = deg > 1 && deg < 359 ? 1 : 0;
  const disc: CSSProperties = {
    position: 'absolute',
    left: 76,
    top: 51,
    width: 208,
    height: 208,
    borderRadius: '50%',
    background: `${GROOVES}, ${SHEEN(m.night)}, ${GLOSS}, ${discFill}`,
    boxShadow: `inset 0 0 0 1px ${WHITE(0.16)}, inset -2px -3px 6px ${BLACK(0.22)}`,
    WebkitMaskImage: mask,
    maskImage: mask,
  };
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 75,
          top: 50,
          width: 210,
          height: 210,
          borderRadius: '50%',
          ...WELL[m.theme],
        }}
      />
      <Svg>
        <path d={MINOR} strokeWidth="1.1" opacity=".6" style={{ stroke: t.ink2 }} />
        <Applied m={m} d={MAJOR} w={2.4} />
        <Applied m={m} d={QUARTER} w={3.4} />
      </Svg>
      {Array.from({ length: m.total > 0 && !m.indef ? 12 : 0 }, (_, i) => (
        <DialLabel
          key={i}
          m={m}
          text={String(Math.round(((m.total / 60) * i) / 12))}
          rr={130}
          deg={i * 30}
          fs={12}
          color={t.ink2}
          extra={{ fontFamily: MONO, fontWeight: 500 }}
        />
      ))}
      <div className="af-tr" style={disc} />
      <Svg>
        <line
          x1="180"
          y1="155"
          x2={f1(ex)}
          y2={f1(ey)}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={edge}
          style={{ stroke: t.panel }}
        />
        <line
          x1="180"
          y1="155"
          x2="180"
          y2="52"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={edge}
          style={{ stroke: t.panel }}
        />
      </Svg>
      <div
        style={{
          position: 'absolute',
          left: 122,
          top: 97,
          width: 116,
          height: 116,
          borderRadius: '50%',
          ...HUB[m.theme],
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: m.long ? fit(m, 24, 21) : 32,
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            color: t.ink,
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontFamily: MONO, fontSize: lmin(12), color: t.ink2 }}>
          {m.indef ? 'no end' : m.endShort}
        </span>
      </div>
      <Crystal m={m} />
    </>
  );
}
