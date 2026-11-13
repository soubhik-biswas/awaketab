import type { CSSProperties } from 'react';
import { BLACK, NAVY, SUB_DIAL, type TThemed, WHITE } from '../art';
import { alpha, arc, f1, P, ticks } from '../geometry';
import { D, DialLabel, DISPLAY, hand, type IDrawProps, L, lmin, MONO, Svg, windowAt } from '../kit';
import type { TFaceModel } from '../model';
import { band, Crystal, minutesSpan } from './analog-dial';

// The minute track skips the minutes either side of 12, where the two lume dots flank the triangle.
const MINOR = ticks(127, 135, 60, (i) => i % 5 !== 0 && i !== 1 && i !== 59);
const MAJOR = ticks(121, 135, 60, (i) => i % 5 === 0 && i !== 0);
const DOTS = [P(131, -7), P(131, 7)] as const;

// A matte dial sunk below the plate's rim: black by night, white enamel by day.
const DIAL: TThemed<CSSProperties> = {
  light: {
    background: 'radial-gradient(130% 100% at 30% 12%, #FFFFFF 0%, #F3F4F8 55%, #E3E5ED 100%)',
    boxShadow: `inset 0 3px 8px ${NAVY(0.16)}, inset 0 -1px 0 #FFFFFF`,
  },
  dark: {
    background: 'radial-gradient(130% 100% at 30% 12%, #1C1F27 0%, #0D0F14 55%, #07080B 100%)',
    boxShadow: `inset 0 3px 8px ${BLACK(0.7)}, inset 0 -1px 0 ${WHITE(0.05)}`,
  },
  oled: { background: '#000000', boxShadow: 'inset 0 0 0 1px #141821' },
};
// Two-facet steel lit from the top left; blackened steel on the white dial.
const METAL: TThemed<string> = {
  light: 'linear-gradient(90deg, #2E3749 50%, #0B1020 50%)',
  dark: 'linear-gradient(90deg, #E4E8F0 50%, #8C95A7 50%)',
  oled: 'linear-gradient(90deg, #E4E8F0 50%, #8C95A7 50%)',
};
const CAP: TThemed<string> = {
  light: 'radial-gradient(circle at 35% 30%, #56607A, #0B1020 70%)',
  dark: 'radial-gradient(circle at 35% 30%, #F4F6FA, #9AA3B5 55%, #4B5366)',
  oled: 'radial-gradient(circle at 35% 30%, #F4F6FA, #9AA3B5 55%, #4B5366)',
};
const WINDOW: TThemed<string> = {
  light: `inset 0 2px 4px ${NAVY(0.2)}, 0 1px 0 #FFFFFF, 0 0 0 1px #D4D4E2`,
  dark: `inset 0 2px 4px ${BLACK(0.8)}, 0 1px 0 ${WHITE(0.07)}, 0 0 0 1px #262A35`,
  oled: `inset 0 2px 4px ${BLACK(0.8)}, 0 0 0 1px #1A2236`,
};

const pt = (rr: number, deg: number): string => P(rr, deg).map(f1).join(' ');

// A sword hand: a straight blade to a short point, narrowing behind the pivot, with a lume inlay in the lamp colour.
function Sword({
  m,
  cls,
  len,
  tail,
  w,
  deg,
  deg0,
}: {
  m: TFaceModel;
  cls: string;
  len: number;
  tail: number;
  w: number;
  deg: number;
  deg0: number;
}) {
  const pivot = ((len / (len + tail)) * 100).toFixed(1);
  const iw = Math.round(w * 0.44);
  const shade = m.night ? BLACK(0.5) : NAVY(0.28);
  return (
    <div className={cls} style={hand(len, tail, w, deg, deg0, 'none', { filter: `drop-shadow(0 2px 2px ${shade})` })}>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background: METAL[m.theme],
          clipPath: `polygon(50% 0, 100% 8%, 100% ${pivot}%, 68% 100%, 32% 100%, 0 ${pivot}%, 0 8%)`,
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: (w - iw) / 2,
            top: 10,
            width: iw,
            height: len - 26,
            background: m.accent,
            clipPath: `polygon(50% 0, 100% ${String(iw / 2)}px, 100% 100%, 0 100%, 0 ${String(iw / 2)}px)`,
          }}
        />
      </span>
    </div>
  );
}

// Aviator dial with a triangle at 12, sword hands and a minutes-left sector on the minute track.
export default function Pilot({ m }: IDrawProps) {
  const { t, accent } = m;
  const span = minutesSpan(m);
  const end = m.minDeg + span;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 15,
          width: 280,
          height: 280,
          borderRadius: '50%',
          ...DIAL[m.theme],
        }}
      />
      <Svg>
        {span > 0 && (
          <>
            <path d={band(121, 136, m.minDeg, span)} style={{ fill: alpha(accent, m.night ? 0x30 : 0x26) }} />
            <path d={arc(137.5, m.minDeg, end)} fill="none" strokeWidth="1.5" style={{ stroke: accent }} />
          </>
        )}
        <circle
          className={D}
          cx="180"
          cy="155"
          r="120"
          fill="none"
          strokeWidth=".8"
          opacity=".5"
          style={{ stroke: t.ink2 }}
        />
        <path className={D} d={MINOR} strokeWidth="1.4" opacity=".75" style={{ stroke: t.ink2 }} />
        <path d={MAJOR} strokeWidth="3" style={{ stroke: t.ink }} />
        <path
          d="M170 22 H190 L180 46 Z"
          strokeWidth="1"
          strokeLinejoin="round"
          style={{ fill: t.ink, stroke: t.ink }}
        />
        {DOTS.map(([x, y]) => (
          <circle key={x} cx={f1(x)} cy={f1(y)} r="2.6" style={{ fill: accent }} />
        ))}
        {span > 0 && span < 359.9 && (
          <path
            className="afx-breath"
            d={`M${pt(118, end)}L${pt(138, end)}`}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ stroke: accent }}
          />
        )}
      </Svg>
      {Array.from({ length: 11 }, (_, k) => (
        <DialLabel
          key={k}
          m={m}
          text={String(k + 1)}
          rr={98}
          deg={(k + 1) * 30}
          fs={25}
          color={t.ink}
          extra={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            textShadow: m.night ? `0 1px 0 ${BLACK(0.45)}` : undefined,
          }}
        />
      ))}
      <div
        className={L}
        style={{
          ...windowAt(180, 194, 72, 28),
          padding: '0 8px',
          borderRadius: 7,
          background: SUB_DIAL[m.theme],
          boxShadow: WINDOW[m.theme],
          fontFamily: MONO,
          fontSize: lmin(14),
          fontWeight: 500,
          letterSpacing: '.02em',
          color: accent,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {m.digits}
      </div>
      <Sword m={m} cls="afx-h" len={74} tail={14} w={14} deg={m.hourDeg} deg0={m.hourDeg0} />
      <Sword m={m} cls="afx-m" len={116} tail={16} w={11} deg={m.minDeg} deg0={m.minDeg0} />
      <div className="afx-s" style={hand(128, 30, 2, m.secDeg, m.secDeg0, accent)}>
        <span
          style={{
            position: 'absolute',
            left: -3,
            top: 140,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: accent,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 172,
          top: 147,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: CAP[m.theme],
          boxShadow: `0 1px 3px ${BLACK(0.5)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: accent }} />
      </div>
      <Crystal m={m} />
    </>
  );
}
