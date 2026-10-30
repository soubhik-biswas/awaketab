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

export const arc = (rr: number, d0: number, d1: number, cx = CX, cy = CY): string => {
  if (d1 - d0 <= 0.05) return '';
  const e = d1 - d0 >= 359.9 ? d0 + 359.9 : d1;
  const [ax, ay] = P(rr, d0, cx, cy);
  const [bx, by] = P(rr, e, cx, cy);
  return `M${f1(ax)} ${f1(ay)} A${rr} ${rr} 0 ${e - d0 > 180 ? 1 : 0} 1 ${f1(bx)} ${f1(by)}`;
};

export const sectorPath = (r1: number, r2: number, d0: number, d1: number): string => {
  if (d1 - d0 <= 0.05) return '';
  const e = d1 - d0 >= 359.9 ? d0 + 359.9 : d1;
  const [ax, ay] = P(r2, d0);
  const [bx, by] = P(r2, e);
  const [cx, cy] = P(r1, e);
  const [dx, dy] = P(r1, d0);
  const lg = e - d0 > 180 ? 1 : 0;
  return `M${f1(ax)} ${f1(ay)} A${r2} ${r2} 0 ${lg} 1 ${f1(bx)} ${f1(by)} L${f1(cx)} ${f1(cy)} A${r1} ${r1} 0 ${lg} 0 ${f1(dx)} ${f1(dy)} Z`;
};

// A ring's stroke-dasharray showing fraction f of circumference c.
export const dash = (c: number, f: number): string => `${(c * Math.max(0.0001, f)).toFixed(1)} ${c.toFixed(1)}`;

// The prototype's two-digit hex alpha suffix (accent + '26') as a colour-mix, so it works on tokens too.
export const alpha = (color: string, hex: number): string =>
  `color-mix(in srgb, ${color} ${(hex / 2.55).toFixed(1)}%, transparent)`;
