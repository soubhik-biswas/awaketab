export const CX = 180;
export const CY = 155;

export const f1 = (n: number): string => n.toFixed(1);
export const pad = (n: number): string => String(n).padStart(2, '0');

export type TPoint = readonly [number, number];

// A point on a circle, with 0° at 12 o'clock running clockwise.
export const P = (rr: number, deg: number, cx = CX, cy = CY): TPoint => {
  const q = ((deg - 90) * Math.PI) / 180;
  return [cx + rr * Math.cos(q), cy + rr * Math.sin(q)];
};

export const ticks = (
  r1: number,
  r2: number,
  n: number,
  keep: (i: number) => boolean = () => true,
  cx = CX,
  cy = CY,
): string => {
  let d = '';
  for (let i = 0; i < n; i++) {
    if (!keep(i)) continue;
    const deg = (360 * i) / n;
    const [ax, ay] = P(r1, deg, cx, cy);
    const [bx, by] = P(r2, deg, cx, cy);
    d += `M${f1(ax)} ${f1(ay)}L${f1(bx)} ${f1(by)}`;
  }
  return d;
};

// One SVG arc command; a span past half a turn is drawn as two, because a single arc whose ends almost meet is
// placed by rounding and can jump off its centre.
const sweepTo = (rr: number, d0: number, e: number, cx: number, cy: number, cw: 0 | 1): string => {
  const seg = (from: number, to: number): string => {
    const [x, y] = P(rr, to, cx, cy);
    return ` A${rr} ${rr} 0 ${Math.abs(to - from) > 180 ? 1 : 0} ${cw} ${f1(x)} ${f1(y)}`;
  };
  if (Math.abs(e - d0) <= 180) return seg(d0, e);
  const mid = (d0 + e) / 2;
  return seg(d0, mid) + seg(mid, e);
};

const end = (d0: number, d1: number): number => (d1 - d0 >= 359.9 ? d0 + 359.9 : d1);

export const arc = (rr: number, d0: number, d1: number, cx = CX, cy = CY): string => {
  if (d1 - d0 <= 0.05) return '';
  const e = end(d0, d1);
  const [ax, ay] = P(rr, d0, cx, cy);
  return `M${f1(ax)} ${f1(ay)}${sweepTo(rr, d0, e, cx, cy, 1)}`;
};

export const sectorPath = (r1: number, r2: number, d0: number, d1: number): string => {
  if (d1 - d0 <= 0.05) return '';
  const e = end(d0, d1);
  const [ax, ay] = P(r2, d0);
  const [cx, cy] = P(r1, e);
  return `M${f1(ax)} ${f1(ay)}${sweepTo(r2, d0, e, CX, CY, 1)} L${f1(cx)} ${f1(cy)}${sweepTo(r1, e, d0, CX, CY, 0)} Z`;
};

// A ring's stroke-dasharray showing fraction f of circumference c.
export const dash = (c: number, f: number): string => `${(c * Math.max(0.0001, f)).toFixed(1)} ${c.toFixed(1)}`;

// The prototype's two-digit hex alpha suffix (accent + '26') as a colour-mix, so it works on tokens too.
export const alpha = (color: string, hex: number): string =>
  `color-mix(in srgb, ${color} ${(hex / 2.55).toFixed(1)}%, transparent)`;
