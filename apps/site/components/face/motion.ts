'use client';

import { type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(useGSAP, CustomEase);
// Loops follow the wall clock, so after a stall or a hidden tab they jump to the right time instead of slowing down.
gsap.ticker.lagSmoothing(0);

type TValue = number | string;
type TTrack = readonly (readonly [number, TValue])[];

// One looping animation: per property, [progress 0–1, value] stops eased like CSS keyframe segments.
interface IFx {
  d: number;
  props: Readonly<Record<string, TTrack>>;
  ease?: TEase;
  origin?: string;
}

const BEZIER = {
  linear: '',
  in: '0.42,0 1,1',
  out: '0,0 0.58,1',
  inOut: '0.42,0 0.58,1',
  step: '',
} as const;
type TEase = keyof typeof BEZIER;

const made = new Set<TEase>();
const easeOf = (k: TEase = 'linear'): string => {
  if (k === 'linear') return 'none';
  if (k === 'step') return 'steps(1)';
  const id = `af-${k}`;
  if (!made.has(k)) {
    CustomEase.create(id, `M0,0 C${BEZIER[k]} 1,1`);
    made.add(k);
  }
  return id;
};

const line = (a: TValue, b: TValue): TTrack => [
  [0, a],
  [1, b],
];
const back = (a: TValue, b: TValue): TTrack => [
  [0, a],
  [0.5, b],
  [1, a],
];
const reversed = (fx: IFx): IFx => ({
  ...fx,
  props: Object.fromEntries(
    Object.entries(fx.props).map(([k, track]) => [k, track.map(([p, v]) => [1 - p, v] as const).reverse()]),
  ),
});

const sweepFrom = (el: Element): number => {
  const v = el instanceof HTMLElement ? parseFloat(el.style.getPropertyValue('--a')) : NaN;
  return Number.isFinite(v) ? v : 0;
};
const sweep =
  (d: number) =>
  (el: Element): IFx => {
    const a = sweepFrom(el);
    return { d, props: { rotation: line(a, a + 360) } };
  };
const spin = (d: number): IFx => ({ d, props: { rotation: line(0, 360) }, origin: '50% 50%' });
const radius = new WeakMap<Element, number>();
// A dot on a dial moves every second, and a scale keeps the origin it had when the loop was built, so the halo of
// an SVG dot grows by its radius instead and stays on the dot.
const pulse = (el: Element): IFx => {
  if (!(el instanceof SVGCircleElement))
    return { d: 2.4, props: { scale: line(0.7, 1.6), opacity: line(0.55, 0) }, ease: 'out', origin: '50% 50%' };
  const r = radius.get(el) ?? el.r.baseVal.value;
  radius.set(el, r);
  return { d: 2.4, props: { 'attr:r': line(r * 0.7, r * 1.6), opacity: line(0.55, 0) }, ease: 'out' };
};
const drift: IFx = {
  d: 14,
  props: {
    x: [
      [0, 0],
      [0.33, 34],
      [0.66, -24],
      [1, 0],
    ],
    y: [
      [0, 0],
      [0.33, -22],
      [0.66, 26],
      [1, 0],
    ],
    scale: [
      [0, 1],
      [0.33, 1.12],
      [0.66, 0.94],
      [1, 1],
    ],
  },
  ease: 'inOut',
};
const MORPH = [
  '42% 58% 63% 37% / 45% 41% 59% 55%',
  '58% 42% 38% 62% / 57% 61% 39% 43%',
  '38% 62% 51% 49% / 38% 52% 48% 62%',
] as const;

// The face loops by class name, matching the prototype's keyframes, durations and timing.
const FX: Readonly<Record<string, IFx | ((el: Element) => IFx)>> = {
  s: sweep(60),
  m: sweep(3600),
  h: sweep(43_200),
  blink: {
    d: 1,
    props: {
      opacity: [
        [0, 1],
        [0.55, 1],
        [0.56, 0.28],
        [1, 0.28],
      ],
    },
    ease: 'step',
  },
  pulse,
  'pulse-d': pulse,
  breath: { d: 3, props: { opacity: back(0.55, 1) }, ease: 'inOut' },
  wave: { d: 6, props: { x: line(0, -176) } },
  wave2: { d: 9, props: { x: line(-176, 0) } },
  rise: {
    d: 4.5,
    props: {
      y: line(0, -150),
      opacity: [
        [0, 0],
        [0.15, 0.7],
        [1, 0],
      ],
    },
    ease: 'in',
  },
  flap: {
    d: 1,
    props: {
      rotationX: [
        [0, 0],
        [0.38, -90],
        [1, -90],
      ],
      opacity: [
        [0, 1],
        [0.38, 1],
        [0.39, 0],
        [1, 0],
      ],
    },
    ease: 'in',
  },
  flick: {
    d: 5,
    props: {
      opacity: [
        [0, 1],
        [0.91, 1],
        [0.92, 0.82],
        [0.94, 0.97],
        [0.96, 0.88],
        [1, 1],
      ],
    },
    ease: 'step',
  },
  marq: { d: 14, props: { xPercent: line(0, -50) } },
  shim: { d: 3.2, props: { opacity: back(0.25, 0.8), scaleX: back(0.85, 1.1) }, ease: 'inOut' },
  twinkle: { d: 3.6, props: { opacity: back(0.25, 0.9) }, ease: 'inOut' },
  jit: { d: 2.2, props: { rotation: back(-0.5, 0.6) }, ease: 'inOut' },
  scan: { d: 5, props: { y: line(-30, 230) } },
  radar: { d: 4, props: { rotation: line(0, 360) } },
  stream: { d: 0.6, props: { strokeDashoffset: line(0, -24) } },
  sheen: { d: 3.2, props: { xPercent: line(-120, 420) }, ease: 'inOut' },
  drift,
  drift2: { ...reversed(drift), d: 19 },
  morph: {
    d: 14,
    props: {
      borderRadius: [
        [0, MORPH[0]],
        [0.33, MORPH[1]],
        [0.66, MORPH[2]],
        [1, MORPH[0]],
      ],
      rotation: [
        [0, 0],
        [0.33, 120],
        [0.66, 240],
        [1, 0],
      ],
    },
    ease: 'inOut',
  },
  spin: spin(9),
  spinR: { ...spin(6), props: { rotation: line(360, 0) } },
  spinS: spin(16),
  wobble: { d: 1, props: { rotation: back(-38, 38) }, ease: 'inOut' },
  ecg: { d: 2.4, props: { x: line(0, -160) } },
  bar: { d: 1.3, props: { scaleY: back(0.55, 1) }, ease: 'inOut' },
  float: { d: 9, props: { x: back(0, 10), y: back(0, -12) }, ease: 'inOut' },
  wl: { d: 3.5, props: { x: line(0, -128) } },
  wl2: { d: 5.5, props: { x: line(-128, 0) } },
};

const SELECTOR = '[class*="afx-"]';

const fxOf = (el: Element): IFx | undefined => {
  for (const c of el.classList) {
    if (!c.startsWith('afx-')) continue;
    const fx = FX[c.slice(4)];
    if (fx) return typeof fx === 'function' ? fx(el) : fx;
  }
  return undefined;
};

// SVG parts that turn about a point of the artboard name it in data-svg-origin ("236 206").
function loop(el: Element, fx: IFx, elapsed: number): void {
  const ease = easeOf(fx.ease);
  const tl = gsap.timeline({ repeat: -1 });
  const svgOrigin = el.getAttribute('data-svg-origin');
  const start: gsap.TweenVars = svgOrigin ? { svgOrigin } : fx.origin ? { transformOrigin: fx.origin } : {};
  for (const [prop, track] of Object.entries(fx.props)) {
    const vars = (v: TValue): gsap.TweenVars =>
      prop.startsWith('attr:') ? { attr: { [prop.slice(5)]: v } } : { [prop]: v };
    const first = track[0];
    if (first) Object.assign(start, vars(first[1]));
    for (let i = 1; i < track.length; i++) {
      const a = track[i - 1];
      const b = track[i];
      if (!a || !b || b[0] <= a[0]) continue;
      tl.fromTo(
        el,
        vars(a[1]),
        { ...vars(b[1]), duration: (b[0] - a[0]) * fx.d, ease, immediateRender: false },
        a[0] * fx.d,
      );
    }
  }
  tl.set(el, start, 0);
  if (tl.duration() < fx.d) tl.set({}, {}, fx.d);
  // The phase follows the time since motion started, so a rebuilt loop carries on where it was; data-delay offsets it.
  const t = elapsed - Number(el.getAttribute('data-delay') ?? 0);
  if (t >= 0) tl.totalTime(t);
  else tl.delay(-t);
}

const ids = new WeakMap<Element, number>();
let nextId = 0;
const idOf = (el: Element): number => {
  let n = ids.get(el);
  if (n === undefined) {
    n = ++nextId;
    ids.set(el, n);
  }
  return n;
};
const signature = (root: Element): string =>
  Array.from(root.querySelectorAll(SELECTOR), (el) => `${idOf(el)}:${el.getAttribute('class') ?? ''}`).join(' ');

// Runs a face's loops with GSAP while it is awake and the system allows motion; the loops rebuild only when the moving parts change.
export function useFaceMotion(root: RefObject<HTMLElement | null>, live: boolean, key: string): void {
  const [sig, setSig] = useState('');
  const start = useRef({ key: '', ms: 0 });

  useLayoutEffect(() => {
    const el = root.current;
    const next = live && el ? signature(el) : '';
    if (next !== sig) setSig(next);
  });

  useGSAP(
    () => {
      const el = root.current;
      if (!sig || !el) return;
      if (start.current.key !== key) start.current = { key, ms: performance.now() };
      const elapsed = (performance.now() - start.current.ms) / 1000;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        for (const node of el.querySelectorAll(SELECTOR)) {
          const fx = fxOf(node);
          if (fx) loop(node, fx, elapsed);
        }
      });
      return () => {
        mm.revert();
      };
    },
    { scope: root, dependencies: [sig, key], revertOnUpdate: true },
  );
}
