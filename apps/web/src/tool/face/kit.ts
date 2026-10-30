import { CX, CY, f1, mx, P, TX, type V } from './base.js';

// A face's drawn word: the locale's string from setFaceText, else the English default.
export const lx = (key: string, def: string, vars?: Record<string, string | number>): string =>
  (TX[key] ?? def).replace(/\{(\w+)\}/gu, (_m, n: string) => String(vars?.[n] ?? ''));

export const wh = (pct: number): string => mx('var(--at-fc-white)', pct);
export const bk = (pct: number): string => mx('var(--at-fc-black)', pct);
export const nv = (pct: number): string => mx('var(--at-fc-navy)', pct);

export const arc = (rr: number, d0: number, d1: number, cx = CX, cy = CY): string => {
  if (d1 - d0 <= 0.05) return '';
  const e = d1 - d0 >= 359.9 ? d0 + 359.9 : d1;
  const A = P(rr, d0, cx, cy);
  const B = P(rr, e, cx, cy);
  return `M${f1(A[0])} ${f1(A[1])} A${rr} ${rr} 0 ${e - d0 > 180 ? 1 : 0} 1 ${f1(B[0])} ${f1(B[1])}`;
};

export const sectorPath = (r1: number, r2: number, d0: number, d1: number): string => {
  if (d1 - d0 <= 0.05) return '';
  const e = d1 - d0 >= 359.9 ? d0 + 359.9 : d1;
  const A = P(r2, d0);
  const B = P(r2, e);
  const C = P(r1, e);
  const D = P(r1, d0);
  const lg = e - d0 > 180 ? 1 : 0;
  return `M${f1(A[0])} ${f1(A[1])} A${r2} ${r2} 0 ${lg} 1 ${f1(B[0])} ${f1(B[1])} L${f1(C[0])} ${f1(C[1])} A${r1} ${r1} 0 ${lg} 0 ${f1(D[0])} ${f1(D[1])} Z`;
};

// A dial label centred on a point of the dial; small sizes rise to the on-screen minimum.
export const lbl = (
  v: V,
  txt: string,
  rr: number,
  deg: number,
  fs0: number,
  color: string,
  extra = '',
  cx = CX,
  cy = CY,
): string => {
  const fs = fs0 <= 14 ? Math.max(fs0, v.LMIN) : fs0;
  const q = P(rr, deg, cx, cy);
  return `<span style="position: absolute; left: ${f1(q[0] - 20)}px; top: ${f1(q[1] - fs * 0.62)}px; width: 40px; text-align: center; font-size: ${fs.toFixed(1)}px; line-height: 1.2; color: ${color}; font-variant-numeric: tabular-nums; ${extra}">${txt}</span>`;
};

export const hand = (len: number, tail: number, w: number, deg: number, deg0: number, bg: string, extra = ''): string =>
  `position: absolute; left: ${CX - w / 2}px; top: ${CY - len}px; width: ${w}px; height: ${len + tail}px; transform-origin: 50% ${((len / (len + tail)) * 100).toFixed(2)}%; transform: rotate(${deg.toFixed(2)}deg); --a: ${deg0.toFixed(2)}deg; background: ${bg}; ${extra}`;

export const dash = (c: number, f: number): string => `${(c * Math.max(0.0001, f)).toFixed(1)} ${c.toFixed(1)}`;

export const stars = (pts: readonly (readonly number[])[], cols: readonly string[]): string =>
  pts
    .map(
      (q, i) =>
        `<span class="afx-twinkle" style="position: absolute; left: ${q[0]}px; top: ${q[1]}px; width: ${q[2] ?? 2}px; height: ${q[2] ?? 2}px; border-radius: 50%; background: ${cols[i % cols.length]}; animation-delay: ${(i * 0.45).toFixed(2)}s;"></span>`,
    )
    .join('');

export const svg = (body: string): string =>
  `<svg style="position: absolute; left: 0; top: 0" width="360" height="310" viewBox="0 0 360 310" aria-hidden="true">${body}</svg>`;

export const each = <T>(xs: readonly T[], fn: (x: T, i: number) => string): string => xs.map(fn).join('');

const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
export const num = (n: number): string =>
  n < 20 ? (ONES[n] ?? '') : `${TENS[Math.floor(n / 10)] ?? ''}${n % 10 ? `-${ONES[n % 10] ?? ''}` : ''}`;
export const hw = (x: number): string => ONES[x % 12 || 12] ?? '';
