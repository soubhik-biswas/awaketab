import type { CSSProperties } from 'react';
import { BLACK, NAVY, SUB_DIAL, type TThemed, WHITE } from '../art';
import { f1, P, ticks } from '../geometry';
import { D, DialLabel, fit, type IDrawProps, L, lmin, MONO, Svg, sweep, windowAt } from '../kit';
import type { TFaceModel } from '../model';
import { Applied, Crystal, METAL } from './analog-dial';

const MINOR = ticks(128, 134, 60, (i) => i % 5 !== 0);
const MAJOR = ticks(121, 134, 60, (i) => i % 5 === 0);
const SUB_MINOR_L = ticks(33, 36, 12, (i) => i % 3 !== 0, 124, 160);
const SUB_MAJOR_L = ticks(29, 36, 12, (i) => i % 3 === 0, 124, 160);
const SUB_MINOR_R = ticks(33, 36, 12, (i) => i % 3 !== 0, 236, 160);
const SUB_MAJOR_R = ticks(29, 36, 12, (i) => i % 3 === 0, 236, 160);
const TAPER = 'polygon(32% 0, 68% 0, 100% 77.3%, 100% 100%, 0 100%, 0 77.3%)';

// A matte, lightly grained main dial: a soft sheen from the top left and a darker rim.
const MATTE: TThemed<string | null> = {
  light: `radial-gradient(ellipse 85% 65% at 30% 14%, ${WHITE(0.85)}, transparent 70%), radial-gradient(circle closest-side, transparent 72%, ${NAVY(0.05)})`,
  dark: `radial-gradient(ellipse 85% 65% at 30% 14%, ${WHITE(0.045)}, transparent 70%), radial-gradient(circle closest-side, transparent 72%, ${BLACK(0.26)})`,
  oled: null,
};
// Concentric azurage grooves on the sub-dials, the classic contrast to a matte dial.
const AZURAGE: TThemed<string> = {
  light: `repeating-radial-gradient(circle, ${NAVY(0.05)} 0, transparent 1.2px, ${NAVY(0.05)} 2.4px)`,
  dark: `repeating-radial-gradient(circle, ${WHITE(0.035)} 0, transparent 1.2px, ${WHITE(0.035)} 2.4px)`,
  oled: `repeating-radial-gradient(circle, ${WHITE(0.03)} 0, transparent 1.2px, ${WHITE(0.03)} 2.4px)`,
};
// Recessed into the dial: shadow on the top-left inner wall, a catch of light on the bottom right.
const RECESS: TThemed<string> = {
  light: `inset 1px 2px 4px ${NAVY(0.18)}, inset -1px -1px 0 ${WHITE(0.9)}`,
  dark: `inset 1px 2px 5px ${BLACK(0.7)}, inset -1px -1px 0 ${WHITE(0.05)}`,
  oled: `inset -1px -1px 0 ${WHITE(0.05)}`,
};

// A faceted hand as two triangles split along its axis: the left facet lit, the right one in shade.
const needle = (
  deg: number,
  len: number,
  half: number,
  tail: number,
  cx: number,
  cy: number,
): readonly [string, string] => {
  const at = (rr: number, a: number): string => P(rr, a, cx, cy).map(f1).join(' ');
  const tip = at(len, deg);
  const back = at(tail, deg + 180);
  return [`M${tip}L${at(half, deg - 90)}L${back}Z`, `M${tip}L${at(half, deg + 90)}L${back}Z`];
};

const at26 = (deg: number): string => P(26, deg, 124, 160).map(f1).join(' ');
// The minutes track in two half arcs, so a long one keeps its centre.
const track = (deg: number): string =>
  deg <= 0.05 ? '' : `M${at26(0)}A26 26 0 0 1 ${at26(deg / 2)}A26 26 0 0 1 ${at26(deg)}`;

const jewel = (m: TFaceModel, size: number, x: number, y: number, ring: number): CSSProperties => ({
  position: 'absolute',
  left: x - size / 2,
  top: y - size / 2,
  width: size,
  height: size,
  borderRadius: '50%',
  background: `radial-gradient(circle at 36% 32%, ${WHITE(0.6)} 0 14%, transparent 48%), ${m.accent}`,
  ...(ring > 0 && { border: `${ring}px solid ${m.t.panel}` }),
  boxShadow: `0 1px 3px ${METAL[m.theme].drop}`,
});

// Minute and second sub-dials with a sweeping chrono hand.
export default function Chrono({ m }: IDrawProps) {
  const { t, accent } = m;
  const k = METAL[m.theme];
  const sub = SUB_DIAL[m.theme];
  const minDeg = Math.min(m.m, 59.9) * 6;
  const [lit, shade] = needle(minDeg, 30, 2.2, 7, 124, 160);
  const matte = MATTE[m.theme];
  const subDial = (cx: number): CSSProperties => ({
    position: 'absolute',
    left: cx - 38,
    top: 122,
    width: 76,
    height: 76,
    borderRadius: '50%',
    background: `${AZURAGE[m.theme]}, ${sub}`,
    boxShadow: `${RECESS[m.theme]}, 0 0 0 1px ${t.line}`,
  });
  return (
    <>
      {matte && (
        <div
          className={D}
          style={{
            position: 'absolute',
            left: 40,
            top: 15,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: matte,
          }}
        />
      )}
      <Svg>
        <circle
          className={D}
          cx="180"
          cy="155"
          r="134"
          fill="none"
          strokeWidth=".8"
          opacity=".4"
          style={{ stroke: t.ink2 }}
        />
        <circle
          className={D}
          cx="180"
          cy="155"
          r="128"
          fill="none"
          strokeWidth=".8"
          opacity=".4"
          style={{ stroke: t.ink2 }}
        />
        <path className={D} d={MINOR} strokeWidth="1.1" opacity=".6" style={{ stroke: t.ink2 }} />
        <Applied m={m} d={MAJOR} w={3} />
      </Svg>
      <div style={subDial(124)} />
      <div style={subDial(236)} />
      <Svg>
        <path className={D} d={SUB_MINOR_L} strokeWidth="1" opacity=".7" style={{ stroke: t.ink2 }} />
        <path className={D} d={SUB_MINOR_R} strokeWidth="1" opacity=".7" style={{ stroke: t.ink2 }} />
        <path d={SUB_MAJOR_L} strokeWidth="1.8" style={{ stroke: t.ink }} />
        <path d={SUB_MAJOR_R} strokeWidth="1.8" style={{ stroke: t.ink }} />
        <circle cx="124" cy="160" r="26" fill="none" strokeWidth="3" opacity=".7" style={{ stroke: t.line }} />
        <path d={track(minDeg)} fill="none" strokeWidth="3" strokeLinecap="round" style={{ stroke: accent }} />
        {m.theme !== 'oled' && (
          <g transform="translate(0.6 0.9)" opacity=".9">
            <path d={lit} style={{ fill: k.drop }} />
            <path d={shade} style={{ fill: k.drop }} />
          </g>
        )}
        <path d={lit} style={{ fill: k.lit }} />
        <path d={shade} style={{ fill: k.shade }} />
        <circle cx="124" cy="160" r="4" style={{ fill: k.body }} />
        <circle cx="124" cy="160" r="1.5" style={{ fill: accent }} />
      </Svg>
      {Array.from({ length: 12 }, (_, i) => (
        <DialLabel
          key={i}
          m={m}
          text={String((i + 1) * 5)}
          rr={110}
          deg={(i + 1) * 30}
          fs={12}
          color={t.ink2}
          extra={{ fontFamily: MONO, fontWeight: 500 }}
        />
      ))}
      <div
        className="afx-s"
        style={{
          position: 'absolute',
          left: 234,
          top: 126,
          width: 4,
          height: 44,
          background: `linear-gradient(90deg, ${WHITE(0.38)} 0 50%, ${BLACK(0.12)} 50%), ${accent}`,
          clipPath: TAPER,
          transformOrigin: '50% 77.3%',
          ...sweep(m),
        }}
      />
      <div style={jewel(m, 8, 236, 160, 0)} />
      <div
        style={{
          ...windowAt(180, 76, 104, 40),
          padding: '0 10px',
          borderRadius: 10,
          background: sub,
          boxShadow: `${RECESS[m.theme]}, 0 0 0 1px ${t.line}`,
          fontSize: fit(m, m.long ? 24 : 28, 22),
          fontWeight: 500,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {m.digits}
      </div>
      <span
        className={L}
        style={{
          position: 'absolute',
          left: 100,
          width: 160,
          top: 208,
          textAlign: 'center',
          textWrap: 'balance',
          lineHeight: 1.15,
          fontSize: lmin(13),
          color: t.ink2,
        }}
      >
        {m.endLine}
      </span>
      <div
        className="afx-s"
        style={{
          position: 'absolute',
          left: 179,
          top: 25,
          width: 2,
          height: 160,
          background: accent,
          boxShadow: `0 0 3px ${k.drop}`,
          transformOrigin: '50% 81.25%',
          opacity: m.liveOp,
          ...sweep(m),
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: -3,
            bottom: 3,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: accent,
          }}
        />
      </div>
      <div style={jewel(m, 12, 180, 155, 2)} />
      <Crystal m={m} />
    </>
  );
}
