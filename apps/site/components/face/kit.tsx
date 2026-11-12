import type { CSSProperties, ReactNode } from 'react';
import { CX, CY, f1, P } from './geometry';
import { CARD_SHADOW } from './art';
import type { TFaceModel } from './model';

export type TStyle = CSSProperties & Record<`--${string}`, string | number>;

export interface IDrawProps {
  m: TFaceModel;
}

// Text that keeps the on-screen minimum (var(--lmin)); the compact face hides it.
export const L = 'af-l';
// Detail (minor ticks, dial numerals, stars) that a thumbnail drops, keeping only the main shape and digits.
export const D = 'af-d';
// The face's own ground (dial, card, glass), outlined when the system forces its colours.
export const PLATE = 'af-plate';
export const lmin = (px: number): string => `max(${px}px, var(--lmin))`;
export const MONO = 'var(--font-geist-mono), ui-monospace, monospace';
// Archivo, the display face; pair it with fontStretch 112 % (or 125 % for the widest cuts).
export const DISPLAY = 'var(--font-archivo), var(--font-inter), sans-serif';

const fill: CSSProperties = { position: 'absolute', left: 0, top: 0, width: 360, height: 310 };
export const column = (gap: number): CSSProperties => ({
  ...fill,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap,
});

export const big = (fontSize: number | string, fontWeight = 300, letterSpacing = '-0.04em'): CSSProperties => ({
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
});

export const mono = (px: number, letterSpacing: string, color: string): CSSProperties => ({
  fontFamily: MONO,
  fontSize: lmin(px),
  letterSpacing,
  color,
});

export function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      style={{ position: 'absolute', left: 0, top: 0 }}
      width={360}
      height={310}
      viewBox="0 0 360 310"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// Wide tracking and capitals suit Latin letters only; they break joined scripts such as Devanagari and crowd CJK.
const LATIN = /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}]*$/u;

export function Kicker({ m, color, style }: IDrawProps & { color?: string; style?: CSSProperties }) {
  const latin = LATIN.test(m.topWord);
  return (
    <span
      className={L}
      style={{
        ...mono(12, latin ? '.16em' : '0', color ?? m.t.ink2),
        textTransform: latin ? 'uppercase' : 'none',
        ...style,
      }}
    >
      {m.topWord}
    </span>
  );
}

export function EndLine({ m, px, style }: IDrawProps & { px: number; style?: CSSProperties }) {
  return (
    <span className={L} style={{ fontSize: lmin(px), color: m.t.ink2, ...style }}>
      {m.endLine}
    </span>
  );
}

export interface IDialLabel {
  text: string;
  rr: number;
  deg: number;
  fs: number;
  color: string;
  extra?: CSSProperties;
  cx?: number;
  cy?: number;
}

// A dial numeral centred on a point of the dial; sizes of 14 px and under rise to the on-screen minimum.
export function DialLabel({ m, text, rr, deg, fs: fs0, color, extra, cx = CX, cy = CY }: IDrawProps & IDialLabel) {
  const fs = fs0 <= 14 ? Math.max(fs0, m.LMIN) : fs0;
  const [x, y] = P(rr, deg, cx, cy);
  return (
    <span
      className={D}
      style={{
        position: 'absolute',
        left: `${f1(x - 20)}px`,
        top: `${f1(y - fs * 0.62)}px`,
        width: 40,
        textAlign: 'center',
        fontSize: `${fs.toFixed(1)}px`,
        lineHeight: 1.2,
        color,
        fontVariantNumeric: 'tabular-nums',
        ...extra,
      }}
    >
      {text}
    </span>
  );
}

// A watch hand pivoting on the dial centre; --a is where its sweep starts while awake.
export const hand = (
  len: number,
  tail: number,
  w: number,
  deg: number,
  deg0: number,
  background: string,
  extra?: CSSProperties,
): TStyle => ({
  position: 'absolute',
  left: CX - w / 2,
  top: CY - len,
  width: w,
  height: len + tail,
  transformOrigin: `50% ${((len / (len + tail)) * 100).toFixed(2)}%`,
  transform: `rotate(${deg.toFixed(2)}deg)`,
  '--a': `${deg0.toFixed(2)}deg`,
  background,
  ...extra,
});

export const sweep = (m: TFaceModel): TStyle => ({
  transform: `rotate(${m.secDeg.toFixed(2)}deg)`,
  '--a': `${m.secDeg0.toFixed(2)}deg`,
});

export type TStar = readonly [number, number, number?];

export function Stars({
  pts,
  colors,
  step = 0.45,
}: {
  pts: readonly TStar[];
  colors: readonly string[];
  step?: number;
}) {
  return pts.map(([x, y, d = 2], i) => (
    <span
      key={i}
      className={`afx-twinkle ${D}`}
      data-delay={(i * step).toFixed(2)}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: d,
        height: d,
        borderRadius: '50%',
        background: colors[i % colors.length],
      }}
    />
  ));
}

// The digit sizes the Volt faces share, smaller when hours make the reading long.
export const digitSize = (m: TFaceModel, size: 'big' | 'mid' | 'sm'): number =>
  ({ big: m.long ? 64 : 92, mid: m.long ? 52 : 72, sm: m.long ? 46 : 62 })[size];

// Ten hours or more is eight characters: such a reading takes the tighter size so it stays inside its dial or card.
export const fit = (m: TFaceModel, size: number, tight: number): number => (m.digits.length > 7 ? tight : size);

// A readout window centred on x that grows with its text instead of letting the text spill out.
export const windowAt = (x: number, top: number, minWidth: number, height: number): CSSProperties => ({
  position: 'absolute',
  left: x,
  top,
  minWidth,
  height,
  padding: '0 4px',
  transform: 'translateX(-50%)',
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

// The rounded card the scene faces draw on: 332 × 282 at 14, 14.
export const card = (m: TFaceModel, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left: 14,
  top: 14,
  width: 332,
  height: 282,
  borderRadius: 44,
  overflow: 'hidden',
  // Its own stacking context, so moving and blurred layers stay clipped to the rounded corners in every browser.
  isolation: 'isolate',
  boxShadow: CARD_SHADOW[m.theme],
  ...extra,
});

export const cardColumn = (gap: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left: 0,
  top: 0,
  width: 332,
  height: 282,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap,
  ...extra,
});
