import type { CSSProperties, ReactNode } from 'react';
import { BLACK, NAVY, type TThemed, WHITE } from '../art';
import { alpha, arc, CX, CY, f1, P, ticks } from '../geometry';
import { D, hand, type IDrawProps, Svg } from '../kit';
import type { TFaceModel } from '../model';

interface IMetal {
  edge: string;
  lit: string;
  body: string;
  shade: string;
  drop: string;
}

// Polished steel lit from the top left: a bright edge, a lit and a shaded facet, and a soft drop below.
export const METAL: TThemed<IMetal> = {
  light: { edge: '#A9B0C2', lit: '#424A61', body: '#0B1020', shade: '#0B1020', drop: NAVY(0.22) },
  dark: { edge: '#FFFFFF', lit: '#F4F6FA', body: '#D6DCE6', shade: '#9CA6BA', drop: BLACK(0.6) },
  oled: { edge: '#FFFFFF', lit: '#F4F6FA', body: '#D6DCE6', shade: '#9CA6BA', drop: 'transparent' },
};

const baton = (k: IMetal): string => `linear-gradient(90deg, ${k.edge} 0 1px, ${k.lit} 1px 50%, ${k.shade} 50%)`;

// Raised indices: a drop to the bottom right, a sliver of light on the top-left edge, then the polished body.
export function Applied({ m, d, w }: IDrawProps & { d: string; w: number }) {
  const k = METAL[m.theme];
  return (
    <>
      {m.theme !== 'oled' && <path d={d} transform="translate(0.7 1.1)" strokeWidth={w} style={{ stroke: k.drop }} />}
      <path d={d} transform="translate(-0.6 -0.6)" strokeWidth={w} style={{ stroke: k.edge }} />
      <path d={d} strokeWidth={w} style={{ stroke: k.body }} />
    </>
  );
}

// The domed crystal: a crescent of light inside the top-left rim and the glass edge shading the bottom right.
const CRYSTAL: TThemed<CSSProperties | null> = {
  light: {
    background: `radial-gradient(circle at 64% 72%, transparent 66%, ${WHITE(0.18)} 73%, transparent 80%)`,
    boxShadow: `inset -5px -7px 16px -9px ${NAVY(0.2)}`,
  },
  dark: {
    background: `radial-gradient(circle at 64% 72%, transparent 66%, ${WHITE(0.055)} 73%, transparent 80%), radial-gradient(ellipse 70% 48% at 30% 12%, ${WHITE(0.04)}, transparent 70%)`,
    boxShadow: `inset 3px 4px 9px -6px ${WHITE(0.2)}, inset -5px -7px 16px -9px ${BLACK(0.55)}`,
  },
  oled: null,
};

export function Crystal({ m, cx = CX, cy = CY, r = 140 }: IDrawProps & { cx?: number; cy?: number; r?: number }) {
  const s = CRYSTAL[m.theme];
  return s ? (
    <div
      className={D}
      style={{
        position: 'absolute',
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        ...s,
      }}
    />
  ) : null;
}

// A sunray finish: fine rays, bright along the light's axis and dark across it. Pure black stays black on OLED.
const SUNRAY: TThemed<string | null> = {
  light: `repeating-conic-gradient(${NAVY(0.022)} 0 2deg, transparent 2deg 4deg), conic-gradient(transparent, ${NAVY(0.05)} 45deg, transparent 90deg, ${WHITE(0.75)} 135deg, transparent 180deg, ${NAVY(0.05)} 225deg, transparent 270deg, ${WHITE(0.75)} 315deg, transparent)`,
  dark: `repeating-conic-gradient(${WHITE(0.022)} 0 2deg, transparent 2deg 4deg), conic-gradient(transparent, ${BLACK(0.22)} 45deg, transparent 90deg, ${WHITE(0.055)} 135deg, transparent 180deg, ${BLACK(0.22)} 225deg, transparent 270deg, ${WHITE(0.055)} 315deg, transparent)`,
  oled: null,
};

const MINOR = ticks(124, 130, 60, (i) => i % 5 !== 0);
const MAJOR = ticks(110, 130, 12, (i) => i !== 0);
const TWELVE = 'M175.5 25V45M184.5 25V45';

// The minutes left as degrees (one minute = 6°), at most a full turn; a session with no end has none.
export const minutesSpan = (m: TFaceModel): number =>
  m.indef ? 0 : Math.min(360, (m.st === 'idle' ? m.total : m.r) / 10);

const pt = (rr: number, deg: number): string => P(rr, deg).map(f1).join(' ');
// A ring sector drawn as two half arcs (a whole ring when it is a full turn), so a sector of nearly a full turn
// cannot lose its centre to rounding as a single arc between two almost equal points does.
export const band = (r1: number, r2: number, d0: number, span: number): string => {
  if (span <= 0.05) return '';
  if (span >= 359.9)
    return `M${CX - r2} ${CY}A${r2} ${r2} 0 1 1 ${CX + r2} ${CY}A${r2} ${r2} 0 1 1 ${CX - r2} ${CY}ZM${CX - r1} ${CY}A${r1} ${r1} 0 1 0 ${CX + r1} ${CY}A${r1} ${r1} 0 1 0 ${CX - r1} ${CY}Z`;
  const d1 = d0 + span;
  const mid = d0 + span / 2;
  return `M${pt(r2, d0)}A${r2} ${r2} 0 0 1 ${pt(r2, mid)}A${r2} ${r2} 0 0 1 ${pt(r2, d1)}L${pt(r1, d1)}A${r1} ${r1} 0 0 0 ${pt(r1, mid)}A${r1} ${r1} 0 0 0 ${pt(r1, d0)}Z`;
};

// Analog: real time on the hands, the lamp sector running from now to the end time.
// `over` sits above the hands, so the time left is never covered.
export function AnalogDial({ m, children, over }: IDrawProps & { children?: ReactNode; over?: ReactNode }) {
  const { t, accent } = m;
  const k = METAL[m.theme];
  const spanN = minutesSpan(m);
  const [ex, ey] = P(136, m.minDeg + spanN);
  const sectorC = alpha(accent, m.theme === 'light' ? 0x2a : 0x38);
  const rays = SUNRAY[m.theme];
  const drop = { boxShadow: `0 0 4px ${k.drop}` };
  return (
    <>
      {rays && (
        <div
          className={D}
          style={{
            position: 'absolute',
            left: 40,
            top: 15,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: rays,
          }}
        />
      )}
      <Svg>
        <path d={band(96, 134, m.minDeg, spanN)} style={{ fill: sectorC }} />
        <path
          d={arc(133.2, m.minDeg, m.minDeg + spanN)}
          fill="none"
          strokeWidth="1.6"
          opacity=".85"
          style={{ stroke: accent }}
        />
        <circle
          className={D}
          cx="180"
          cy="155"
          r="130.5"
          fill="none"
          strokeWidth=".8"
          opacity=".45"
          style={{ stroke: t.ink2 }}
        />
        <path
          className={D}
          d={MINOR}
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity=".55"
          style={{ stroke: t.ink2 }}
        />
        <Applied m={m} d={MAJOR} w={5} />
        <Applied m={m} d={TWELVE} w={3.5} />
        {spanN > 0 && (
          <>
            <circle cx={f1(ex)} cy={f1(ey)} r="5.5" strokeWidth="2" style={{ fill: accent, stroke: t.panel }} />
            <circle className="afx-pulse" cx={f1(ex)} cy={f1(ey)} r="6" opacity={m.haloOp} style={{ fill: accent }} />
          </>
        )}
      </Svg>
      {children}
      <div className="afx-h" style={hand(70, 14, 8, m.hourDeg, m.hourDeg0, baton(k), { borderRadius: 4, ...drop })} />
      <div className="afx-m" style={hand(110, 16, 6, m.minDeg, m.minDeg0, baton(k), { borderRadius: 3, ...drop })} />
      <div className="afx-s" style={hand(124, 30, 2, m.secDeg, m.secDeg0, accent, drop)}>
        <span
          style={{
            position: 'absolute',
            left: -4,
            bottom: 14,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: accent,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 173,
          top: 148,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: `radial-gradient(circle at 36% 32%, ${WHITE(0.65)} 0 14%, transparent 48%), ${accent}`,
          border: `3px solid ${t.panel}`,
          boxShadow: `0 0 0 1px ${k.shade}, 0 1px 4px ${k.drop}`,
        }}
      />
      {over}
      <Crystal m={m} />
    </>
  );
}
