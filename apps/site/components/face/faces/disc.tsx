import type { CSSProperties } from 'react';
import { BLACK, WHITE, themed } from '../art';
import { alpha, f1, P, ticks } from '../geometry';
import { DialLabel, type IDrawProps, L, MONO, lmin, Svg } from '../kit';

const WELL = { light: '#E9E9F1', dark: '#0A0B10', oled: '#0A0E18' };
const PILL = { light: 'rgba(255,255,255,.94)', night: 'rgba(10,15,28,.9)' };
const MINOR = ticks(110, 115, 60, (i) => i % 5 !== 0);
const MAJOR = ticks(108, 117, 12);

// A solid disc that shrinks toward 12, in one heat colour: green, then lime, amber and ember.
export default function Disc({ m }: IDrawProps) {
  const { t } = m;
  const deg = 360 * m.ringFrac;
  const hc = m.heat(m.frac);
  const discFill = `radial-gradient(circle at 50% 30%, ${alpha(hc, 0xf2)}, ${hc} 70%, ${alpha(hc, 0xcc)} 100%)`;
  const mask = `conic-gradient(#000 0deg ${deg.toFixed(2)}deg, transparent ${deg.toFixed(2)}deg 360deg)`;
  const [ex, ey] = P(105, deg);
  const edge = deg > 1 && deg < 359 ? 1 : 0;
  const disc: CSSProperties = {
    position: 'absolute',
    left: 76,
    top: 51,
    width: 208,
    height: 208,
    borderRadius: '50%',
    WebkitMaskImage: mask,
    maskImage: mask,
  };
  return (
    <>
      <Svg>
        <circle cx="180" cy="155" r="105" style={{ fill: themed(m.theme, WELL) }} />
        <path d={MINOR} strokeWidth="1.2" opacity=".55" style={{ stroke: t.ink2 }} />
        <path d={MAJOR} strokeWidth="2.4" strokeLinecap="round" style={{ stroke: t.ink }} />
      </Svg>
      {Array.from({ length: 12 }, (_, i) => (
        <DialLabel
          key={i}
          m={m}
          text={String(Math.round(((m.total / 60) * i) / 12))}
          rr={128}
          deg={i * 30}
          fs={12}
          color={t.ink2}
          extra={{ fontFamily: MONO, fontWeight: 500 }}
        />
      ))}
      <div className="af-tr" style={{ ...disc, background: discFill }} />
      <div style={{ ...disc, background: `radial-gradient(circle at 50% 22%, ${WHITE(0.22)}, transparent 58%)` }} />
      <Svg>
        <line
          x1="180"
          y1="155"
          x2={f1(ex)}
          y2={f1(ey)}
          strokeWidth="3"
          strokeLinecap="round"
          opacity={edge}
          style={{ stroke: t.panel }}
        />
        <line
          x1="180"
          y1="155"
          x2="180"
          y2="50"
          strokeWidth="3"
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
          background: m.night ? PILL.night : PILL.light,
          border: `1px solid ${t.line}`,
          boxShadow: `0 14px 30px ${BLACK(0.35)}, inset 0 1px 0 ${WHITE(0.1)}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: m.long ? 22 : 30,
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
          {m.endShort}
        </span>
      </div>
    </>
  );
}
