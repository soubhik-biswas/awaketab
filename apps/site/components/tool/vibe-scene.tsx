'use client';

import { memo, useId, type CSSProperties } from 'react';
import { Meteors } from '@/components/ui-effects/meteors';
import { cn } from '@/lib/utils';
import type { TVibe, TVibeMotion } from '@/lib/tool/settings';

type TVars = CSSProperties & Record<`--${string}`, string | number>;
type TStop = readonly [number, string, number];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const svgUrl = (svg: string) =>
  `url(data:image/svg+xml,${encodeURIComponent(svg).replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/'/g, '%27')})`;

const NOISE_URL = svgUrl(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
);

const pc = (n: number) => `${n.toFixed(2)}%`;
const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '');

// A smooth skyline through seeded points, closed along the bottom of a 1000 × h box.
function ridge(seed: number, n: number, base: number, amp: number, h: number) {
  const r = rng(seed);
  let px = 0;
  let py = base - r() * amp;
  let d = `M-10 ${h}L-10 ${py.toFixed(1)}L0 ${py.toFixed(1)}`;
  for (let i = 1; i <= n; i++) {
    const x = (i / n) * 1000;
    const y = base - r() * amp - Math.sin(i * 1.7 + seed) * amp * 0.3;
    d += `Q${px.toFixed(1)} ${py.toFixed(1)} ${((px + x) / 2).toFixed(1)} ${((py + y) / 2).toFixed(1)}`;
    px = x;
    py = y;
  }
  return `${d}L1010 ${py.toFixed(1)}L1010 ${h}Z`;
}

interface IStar {
  left: string;
  top: string;
  size: number;
  color: string;
  glow: boolean;
}

// Stars fall into four sets: one holds still and three breathe out of step, so the sky twinkles with four layers.
function starField(seed: number, n: number, y0: number, y1: number, palette: readonly string[]) {
  const r = rng(seed);
  const sets: IStar[][] = [[], [], [], []];
  for (let i = 0; i < n; i++) {
    const big = r() < 0.1;
    sets[i % 4]?.push({
      left: pc(r() * 100),
      top: pc(y0 + r() * (y1 - y0)),
      size: big ? 2.2 : r() < 0.45 ? 1.5 : 1,
      color: palette[Math.floor(r() * palette.length)] ?? '#FFFFFF',
      glow: big,
    });
  }
  return sets;
}

const TWINKLE: TVars[] = [
  { '--d': '5.5s', '--o0': 0.2, animationDelay: '-2s' },
  { '--d': '7.3s', '--o0': 0.3, animationDelay: '-5s' },
  { '--d': '9.1s', '--o0': 0.15, animationDelay: '-1s' },
];

function Stars({ sets, glow }: { sets: IStar[][]; glow: string }) {
  return sets.map((set, k) => (
    <div key={k} className={cn('absolute inset-0', k > 0 && 'tg-a tg-twinkle')} style={TWINKLE[k - 1]}>
      {set.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: s.glow ? `0 0 6px 1px ${glow}` : undefined,
          }}
        />
      ))}
    </div>
  ));
}

// Aurora: a still lake under two curtains of northern light. Each curtain is one lower edge stacked upwards in
// fading strokes, cut into rays and softened once, so the moving layer is a flat picture the compositor slides.
const A_EDGE1 = 'M-40 330C80 318 170 262 290 270S470 168 570 150S760 214 860 246S990 262 1040 236';
const A_EDGE2 = 'M-40 190C120 228 250 120 400 136S620 86 760 120S930 170 1040 140';
const A_LAYERS = Array.from({ length: 16 }, (_, i) => ({ y: -i * 12, o: 0.55 * Math.pow(1 - i / 16, 1.7) }));

function rays(seed: number) {
  const r = rng(seed);
  const out: { x: number; w: number; o: number }[] = [];
  for (let x = -60; x < 1060;) {
    const w = 3 + r() * 12;
    out.push({ x, w, o: 0.35 + r() * 0.65 });
    x += w + 2 + r() * 9;
  }
  return out;
}
const RAYS1 = rays(11);
const RAYS2 = rays(23);

function Curtain({ edge, stops, cuts }: { edge: string; stops: readonly TStop[]; cuts: typeof RAYS1 }) {
  const id = safeId(useId());
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 1000 500" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0">
          {stops.map(([o, c, a]) => (
            <stop key={o} offset={o} stopColor={c} stopOpacity={a} />
          ))}
        </linearGradient>
        <filter id={`${id}f`} filterUnits="userSpaceOnUse" x="-60" y="-80" width="1120" height="660">
          <feGaussianBlur stdDeviation="7 5" />
        </filter>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="-60" y="-80" width="1120" height="660">
          <rect x="-60" y="-80" width="1120" height="660" fill="#FFFFFF" fillOpacity={0.3} />
          {cuts.map((c) => (
            <rect key={c.x} x={c.x} y="-80" width={c.w} height="660" fill="#FFFFFF" fillOpacity={c.o} />
          ))}
        </mask>
      </defs>
      <g filter={`url(#${id}f)`}>
        <g mask={`url(#${id}m)`}>
          {A_LAYERS.map((l) => (
            <path
              key={l.y}
              d={edge}
              transform={`translate(0 ${l.y})`}
              fill="none"
              stroke={`url(#${id}g)`}
              strokeWidth={18}
              strokeOpacity={l.o}
            />
          ))}
          <path d={edge} fill="none" stroke={`url(#${id}g)`} strokeWidth={5} />
        </g>
      </g>
    </svg>
  );
}

const AURORA = {
  dark: {
    sky: 'radial-gradient(ellipse 80% 45% at 50% 78%, rgba(40,130,115,.2), transparent 70%), linear-gradient(180deg, #03040A 0%, #050915 38%, #08122A 64%, #0C1C30 77%)',
    c1: [
      [0, '#3DF58E', 0],
      [0.14, '#3DF58E', 0.85],
      [0.36, '#7CF0C8', 0.7],
      [0.55, '#3DF58E', 0.5],
      [0.72, '#7CBBFF', 0.45],
      [0.88, '#9F7BFF', 0.6],
      [1, '#9F7BFF', 0],
    ],
    c2: [
      [0, '#9F7BFF', 0],
      [0.2, '#9F7BFF', 0.7],
      [0.45, '#7CBBFF', 0.4],
      [0.7, '#C1B1FE', 0.6],
      [1, '#9F7BFF', 0],
    ],
    far: '#0A1322',
    farRim: 'rgba(124,240,200,.22)',
    near: '#05080F',
    nearRim: 'rgba(159,123,255,.16)',
    lake: 'radial-gradient(ellipse 40% 70% at 36% 0%, rgba(61,245,142,.13), transparent 70%), radial-gradient(ellipse 35% 70% at 74% 0%, rgba(159,123,255,.11), transparent 70%), linear-gradient(180deg, #08111F 0%, #04070D 100%)',
    ripple: 'rgba(124,240,200,.055)',
    line: 'rgba(124,240,200,.42)',
    lineGlow: 'rgba(61,245,142,.12)',
  },
  light: {
    sky: 'radial-gradient(ellipse 80% 45% at 50% 78%, rgba(255,255,255,.75), transparent 70%), linear-gradient(180deg, #D9EDE7 0%, #E5EDF8 40%, #F0EDF9 66%, #F8F2F4 77%)',
    c1: [
      [0, '#16A85E', 0],
      [0.14, '#16A85E', 0.55],
      [0.36, '#1FA88A', 0.45],
      [0.55, '#16A85E', 0.35],
      [0.72, '#2E74D0', 0.3],
      [0.88, '#6B45EE', 0.42],
      [1, '#6B45EE', 0],
    ],
    c2: [
      [0, '#6B45EE', 0],
      [0.2, '#6B45EE', 0.4],
      [0.45, '#2E74D0', 0.22],
      [0.7, '#8E6CF5', 0.36],
      [1, '#6B45EE', 0],
    ],
    far: '#C6D2E5',
    farRim: 'rgba(255,255,255,.95)',
    near: '#ABB9D0',
    nearRim: 'rgba(255,255,255,.6)',
    lake: 'radial-gradient(ellipse 40% 70% at 36% 0%, rgba(17,160,90,.11), transparent 70%), radial-gradient(ellipse 35% 70% at 74% 0%, rgba(102,51,245,.09), transparent 70%), linear-gradient(180deg, #DAE3F0 0%, #E8EDF5 100%)',
    ripple: 'rgba(40,70,130,.07)',
    line: 'rgba(17,122,59,.32)',
    lineGlow: 'rgba(17,122,59,.06)',
  },
} as const;

const A_STARS = starField(7, 44, 2, 52, ['#FFFFFF', '#FFFFFF', '#C1B1FE', '#CFF8E4']);
const A_FAR = ridge(3, 22, 150, 90, 200);
const A_NEAR =
  'M-10 100L-10 22Q60 4 140 18Q230 36 300 64Q350 84 410 100ZM1010 100L1010 14Q930 2 860 20Q770 44 700 72Q660 90 610 100Z';

function Aurora({ night }: { night: boolean }) {
  const c = night ? AURORA.dark : AURORA.light;
  return (
    <>
      <div className="absolute inset-0" style={{ background: c.sky }} />
      {night ? <Stars sets={A_STARS} glow="rgba(255,255,255,.45)" /> : null}
      <div
        className="tg-a tg-curtain absolute"
        style={
          {
            left: '-8%',
            width: '116%',
            top: '-6%',
            height: '52%',
            transformOrigin: '50% 100%',
            '--d': '34s',
            '--sx': '1.6%',
            '--sy': 1.07,
            '--o0': 0.7,
            animationDelay: '-9s',
          } as TVars
        }
      >
        <Curtain edge={A_EDGE2} stops={c.c2} cuts={RAYS2} />
      </div>
      <div
        className="tg-a tg-curtain absolute"
        style={
          {
            left: '-8%',
            width: '116%',
            top: 0,
            height: '60%',
            transformOrigin: '50% 100%',
            '--d': '26s',
            '--sx': '2.4%',
            '--sy': 1.1,
            '--o0': 0.78,
            animationDelay: '-4s',
            animationDirection: 'alternate-reverse',
          } as TVars
        }
      >
        <Curtain edge={A_EDGE1} stops={c.c1} cuts={RAYS1} />
      </div>
      <div
        className="tg-a tg-sway absolute"
        style={{ left: '-3%', width: '106%', bottom: '23%', height: '17%', '--sx': '0.35%', '--d': '80s' } as TVars}
      >
        <svg className="absolute inset-0 size-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
          <path d={A_FAR} fill={c.far} stroke={c.farRim} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="absolute inset-x-0 bottom-0 overflow-hidden" style={{ height: '23.5%', background: c.lake }}>
        <div
          className="tg-a tg-fall absolute inset-x-0 bottom-0"
          style={
            {
              top: -8,
              backgroundImage: `repeating-linear-gradient(180deg, transparent 0 7px, ${c.ripple} 7px 8px)`,
              maskImage: 'linear-gradient(180deg, #000, transparent 85%)',
              '--fall': '8px',
              '--d': '6s',
            } as TVars
          }
        />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${c.line} 30%, ${c.line} 70%, transparent)`,
            boxShadow: `0 0 36px 8px ${c.lineGlow}`,
          }}
        />
      </div>
      <div
        className="tg-a tg-sway absolute"
        style={{ left: '-3%', width: '106%', bottom: '19%', height: '12%', '--sx': '1%', '--d': '80s' } as TVars}
      >
        <svg className="absolute inset-0 size-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
          <path d={A_NEAR} fill={c.near} stroke={c.nearRim} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      {night ? (
        <span
          className="tg-a tg-travel absolute size-[2px] rounded-full bg-white"
          style={{ left: '6%', top: '9%', '--tx': '62cqw', '--ty': '5cqh', '--o1': 0.7, '--d': '96s' } as TVars}
        />
      ) : null}
    </>
  );
}

// Night sky: a slowly turning sky over dark hills and a small town, a crescent moon, low mist and a shooting star.
const N_STARS = starField(17, 96, 8, 66, ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#C1B1FE', '#FFE9C4', '#BFD8FF']);
const N_FAR = ridge(9, 9, 92, 50, 120);
const N_NEAR = ridge(5, 6, 70, 46, 160);
const N_TOWN = Array.from({ length: 11 }, (_, i) => {
  const r = rng(40 + i);
  return { left: pc(60 + r() * 22), top: pc(78 + r() * 16), on: i % 3 === 0 };
});
const MILKY =
  'radial-gradient(circle at 20% 30%, rgba(255,255,255,.55) 0 .6px, transparent 1.1px) 0 0/37px 41px, radial-gradient(circle at 70% 60%, rgba(255,255,255,.4) 0 .5px, transparent 1px) 0 0/53px 47px, radial-gradient(circle at 40% 80%, rgba(210,200,255,.45) 0 .6px, transparent 1.1px) 0 0/71px 67px, radial-gradient(ellipse 50% 50% at 50% 50%, rgba(170,160,255,.14), rgba(124,187,255,.05) 50%, transparent 72%)';

const NIGHT = {
  dark: {
    sky: 'linear-gradient(180deg, #02030A 0%, #050819 38%, #0A1030 70%, #191744 84%)',
    glow: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(124,92,255,.2), transparent 70%), radial-gradient(ellipse 30% 50% at 72% 100%, rgba(255,170,110,.1), transparent 70%)',
    mist: 'rgba(150,160,230,.08)',
    far: '#0B0F27',
    near: '#04050D',
    rim: 'rgba(159,123,255,.18)',
    moon: '#F4ECD6',
    moonGlow: 'rgba(244,236,214,.25)',
    shade: 'radial-gradient(circle at 65% 40%, rgba(200,210,255,.08), transparent 70%)',
    halo: 'radial-gradient(circle closest-side, rgba(233,221,180,.13), transparent)',
  },
  light: {
    sky: 'linear-gradient(180deg, #C6D6F1 0%, #D9E2F4 38%, #E9EAF5 70%, #F6EBEE 84%)',
    glow: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(255,215,200,.55), transparent 70%)',
    mist: 'rgba(255,255,255,.6)',
    far: '#B9C3DF',
    near: '#9AA7C8',
    rim: 'rgba(255,255,255,.7)',
    moon: 'rgba(255,255,255,.95)',
    moonGlow: 'rgba(255,255,255,.55)',
    shade: 'none',
    halo: 'radial-gradient(circle closest-side, rgba(255,255,255,.5), transparent)',
  },
} as const;

const MIST_TILE =
  'radial-gradient(ellipse 16% 40% at 18% 60%, var(--mist), transparent 70%), radial-gradient(ellipse 14% 34% at 50% 45%, var(--mist), transparent 70%), radial-gradient(ellipse 15% 38% at 80% 58%, var(--mist), transparent 70%)';

function Night({ night, narrow, topH }: { night: boolean; narrow: boolean; topH: number }) {
  const c = night ? NIGHT.dark : NIGHT.light;
  const moon = narrow ? 34 : 'clamp(10px, 6.5cqmin, 70px)';
  const moonPos: CSSProperties = narrow ? { right: 22, top: topH + 12 } : { right: '12%', top: '13%' };
  return (
    <>
      <div className="absolute inset-0" style={{ background: c.sky }} />
      <div className="absolute inset-x-0 bottom-0 h-[40%]" style={{ background: c.glow }} />
      {night ? (
        <div
          className="tg-a tg-tilt absolute"
          style={
            {
              left: '-12%',
              right: '-12%',
              top: '-12%',
              height: '124%',
              transformOrigin: '50% 100%',
              '--r': '0.8deg',
              '--d': '160s',
            } as TVars
          }
        >
          <div
            className="absolute"
            style={{
              left: '8%',
              top: '6%',
              width: '90%',
              height: '42%',
              rotate: '-26deg',
              background: MILKY,
              maskImage: 'radial-gradient(ellipse 50% 46% at 50% 50%, #000 20%, transparent 100%)',
            }}
          />
          <Stars sets={N_STARS} glow="rgba(255,255,255,.5)" />
        </div>
      ) : null}
      <div
        className="tg-a tg-breathe absolute rounded-full"
        style={
          {
            ...moonPos,
            width: narrow ? 170 : 'clamp(60px, 34cqmin, 360px)',
            height: narrow ? 170 : 'clamp(60px, 34cqmin, 360px)',
            margin: narrow ? '-68px' : 'calc(clamp(60px, 34cqmin, 360px) / -2 + clamp(10px, 6.5cqmin, 70px) / 2)',
            background: c.halo,
            '--o0': 0.7,
            '--s1': 1.05,
            '--d': '12s',
          } as TVars
        }
      />
      <div
        className="absolute rounded-full"
        style={{
          ...moonPos,
          width: moon,
          height: moon,
          fontSize: moon,
          background: c.shade,
          boxShadow: `inset .24em -.1em 0 0 ${c.moon}, 0 0 .5em ${c.moonGlow}`,
        }}
      />
      <div
        className="tg-a tg-pan absolute bottom-[14%] left-0 h-[18%] w-[200%]"
        style={
          {
            '--mist': c.mist,
            backgroundImage: MIST_TILE,
            backgroundSize: '50% 100%',
            backgroundRepeat: 'repeat-x',
            '--d': '220s',
          } as TVars
        }
      />
      <div className="absolute inset-x-0 bottom-[12%] h-[10%]">
        <svg className="absolute inset-0 size-full" viewBox="0 0 1000 120" preserveAspectRatio="none">
          <path d={N_FAR} fill={c.far} />
        </svg>
        {night
          ? N_TOWN.map((t, i) => (
              <span
                key={i}
                className={cn('absolute size-[2px] rounded-full', t.on && 'tg-a tg-twinkle')}
                style={
                  {
                    left: t.left,
                    top: t.top,
                    background: '#FFC478',
                    boxShadow: '0 0 4px rgba(255,196,120,.8)',
                    '--d': `${6 + i}s`,
                    '--o0': 0.35,
                  } as TVars
                }
              />
            ))
          : null}
      </div>
      <div
        className="tg-a tg-pan absolute bottom-[4%] left-0 h-[14%] w-[200%]"
        style={
          {
            '--mist': c.mist,
            backgroundImage: MIST_TILE,
            backgroundSize: '50% 100%',
            backgroundRepeat: 'repeat-x',
            animationDirection: 'reverse',
            '--d': '160s',
          } as TVars
        }
      />
      <div className="absolute inset-x-0 bottom-0 h-[16%]">
        <svg className="absolute inset-0 size-full" viewBox="0 0 1000 160" preserveAspectRatio="none">
          <path d={N_NEAR} fill={c.near} stroke={c.rim} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      {night ? (
        <Meteors
          angle={24}
          tail={130}
          className="tg-a tg-meteor"
          meteors={[
            { left: '34%', top: '8%', '--d': '17s', '--mx': '420px', animationDelay: '-3s' } as TVars,
            { left: '96%', top: '30%', '--d': '23s', '--mx': '380px', animationDelay: '-14s' } as TVars,
          ]}
        />
      ) : null}
    </>
  );
}

// Rain on glass: a blurred city behind a wet window. Two sheets of rain fall at different speeds, beads sit on the
// glass, now and then one runs down it, headlights pass far below and, in the dark, lightning glows far away.
function rainTile(
  seed: number,
  w: number,
  h: number,
  n: number,
  len: [number, number],
  a: [number, number],
  sw: number,
) {
  return (rgb: string) => {
    const r = rng(seed);
    let body = '';
    for (let i = 0; i < n; i++) {
      const x = (r() * w).toFixed(1);
      const y = r() * h;
      const l = len[0] + r() * (len[1] - len[0]);
      const op = (a[0] + r() * (a[1] - a[0])).toFixed(2);
      for (const off of [0, -h]) {
        if (y + off + l > 0 && y + off < h) {
          body += `<rect x='${x}' y='${(y + off).toFixed(1)}' width='${sw}' height='${l.toFixed(1)}' rx='${sw / 2}' fill='url(#g)' fill-opacity='${op}'/>`;
        }
      }
    }
    return svgUrl(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='rgb(${rgb})' stop-opacity='0'/><stop offset='1' stop-color='rgb(${rgb})'/></linearGradient></defs>${body}</svg>`,
    );
  };
}
const RAIN_FAR = rainTile(31, 200, 320, 34, [18, 44], [0.25, 0.6], 1);
const RAIN_NEAR = rainTile(37, 260, 480, 12, [40, 90], [0.25, 0.55], 1.6);
const RAIN_TILES = {
  dark: { far: RAIN_FAR('200,220,255'), near: RAIN_NEAR('210,228,255') },
  light: { far: RAIN_FAR('60,85,130'), near: RAIN_NEAR('70,95,140') },
};

interface IDisc {
  left: string;
  top: string;
  size: string;
  k: number;
  a: number;
}

function discs(seed: number, n: number, s0: number, s1: number, a0: number, a1: number, low: number) {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i): IDisc => {
    const y = r() < low ? 55 + r() * 40 : r() * 55;
    return {
      left: pc(r() * 100),
      top: pc(y),
      size: `${(s0 + r() * (s1 - s0)).toFixed(1)}cqmin`,
      k: i,
      a: a0 + r() * (a1 - a0),
    };
  });
}
const BOKEH_FAR = discs(51, 18, 2.5, 8, 0.45, 1, 0.7);
const BOKEH_NEAR = discs(57, 5, 11, 18, 0.25, 0.45, 0.5);

const BEADS = (() => {
  const r = rng(61);
  const out: { left: string; top: string; size: number }[] = [];
  while (out.length < 44) {
    const x = r();
    const y = r();
    const size = 3 + Math.round(r() * r() * 9);
    if (((x - 0.5) / 0.24) ** 2 + ((y - 0.46) / 0.32) ** 2 < 1) continue;
    out.push({ left: pc(x * 100), top: pc(y * 100), size });
  }
  return out;
})();

const RUNS = [
  { left: '9%', top: '6%', ty: '30cqh', d: '23s', delay: '-4s' },
  { left: '87%', top: '12%', ty: '38cqh', d: '31s', delay: '-17s' },
  { left: '71%', top: '60%', ty: '22cqh', d: '37s', delay: '-28s' },
];

const RAIN = {
  dark: {
    base: 'radial-gradient(ellipse 90% 50% at 50% 100%, rgba(255,150,80,.09), transparent 70%), linear-gradient(180deg, #070B14 0%, #0A111F 50%, #0E1626 100%)',
    ceiling: 'linear-gradient(180deg, rgba(20,28,46,.6), transparent)',
    colors: ['255,170,80', '255,214,170', '90,220,210', '159,123,255', '255,95,110', '124,187,255'],
    bokeh: 0.4,
    bead: 'radial-gradient(circle at 36% 30%, rgba(255,255,255,.7) 0 12%, rgba(190,210,255,.1) 30%, rgba(6,10,20,.35) 68%, rgba(200,220,255,.35) 88%, transparent 100%)',
    trail: 'linear-gradient(180deg, transparent, rgba(200,220,255,.16))',
    lights: 'rgba(255,236,200,.5)',
    far: 0.55,
    near: 0.7,
  },
  light: {
    base: 'radial-gradient(ellipse 90% 50% at 50% 100%, rgba(255,190,140,.16), transparent 70%), linear-gradient(180deg, #D2DBE7 0%, #DDE4EE 45%, #E8ECF2 100%)',
    ceiling: 'linear-gradient(180deg, rgba(160,175,200,.35), transparent)',
    colors: ['255,160,80', '255,200,140', '70,150,200', '130,100,230', '230,90,110', '90,140,210'],
    bokeh: 0.32,
    bead: 'radial-gradient(circle at 36% 30%, #FFFFFF 0 14%, rgba(255,255,255,.3) 32%, rgba(90,110,150,.12) 68%, rgba(60,80,120,.38) 88%, transparent 100%)',
    trail: 'linear-gradient(180deg, transparent, rgba(70,95,140,.14))',
    lights: 'rgba(255,170,90,.4)',
    far: 0.5,
    near: 0.6,
  },
} as const;

function Disc({ d, colors, alpha }: { d: IDisc; colors: readonly string[]; alpha: number }) {
  const rgb = colors[d.k % colors.length] ?? '255,255,255';
  const a = d.a * alpha;
  return (
    <span
      className="absolute rounded-full"
      style={{
        left: d.left,
        top: d.top,
        width: d.size,
        height: d.size,
        background: `radial-gradient(circle closest-side, rgba(${rgb},${(a * 0.55).toFixed(3)}) 0 72%, rgba(${rgb},${a.toFixed(3)}) 88%, rgba(${rgb},0) 100%)`,
      }}
    />
  );
}

function Rain({ night }: { night: boolean }) {
  const c = night ? RAIN.dark : RAIN.light;
  const t = night ? RAIN_TILES.dark : RAIN_TILES.light;
  return (
    <>
      <div className="absolute inset-0" style={{ background: c.base }} />
      <div className="absolute inset-x-0 top-0 h-[30%]" style={{ background: c.ceiling }} />
      {night ? (
        <div
          className="tg-a tg-flash absolute inset-0"
          style={
            {
              background: 'radial-gradient(ellipse 55% 40% at 18% 0%, rgba(175,195,255,.26), transparent 70%)',
              '--d': '29s',
              animationDelay: '-11s',
            } as TVars
          }
        />
      ) : null}
      <div className="tg-a tg-sway absolute inset-0" style={{ '--sx': '1.2%', '--d': '44s' } as TVars}>
        {BOKEH_FAR.map((d) => (
          <Disc key={d.k} d={d} colors={c.colors} alpha={c.bokeh} />
        ))}
      </div>
      <div
        className="tg-a tg-travel absolute flex gap-[1.6cqmin]"
        style={{ left: '-14%', bottom: '18%', '--tx': '130cqw', '--ty': '0px', '--o1': 1, '--d': '41s' } as TVars}
      >
        {[0, 1].map((k) => (
          <span
            key={k}
            className="size-[3.2cqmin] rounded-full"
            style={{ background: `radial-gradient(circle closest-side, ${c.lights}, transparent)` }}
          />
        ))}
      </div>
      <div
        className="absolute inset-0"
        style={{
          maskImage:
            'linear-gradient(180deg, transparent, #000 12%, #000 88%, transparent), radial-gradient(ellipse 30% 36% at 50% 46%, rgba(0,0,0,.3), #000 100%)',
          maskComposite: 'intersect',
        }}
      >
        <div className="absolute -inset-[18%] rotate-[11deg]">
          <div
            className="tg-a tg-fall absolute inset-x-0 bottom-0"
            style={
              {
                top: -320,
                backgroundImage: t.far,
                backgroundSize: '200px 320px',
                opacity: c.far,
                '--fall': '320px',
                '--d': '1.7s',
              } as TVars
            }
          />
          <div
            className="tg-a tg-fall absolute inset-x-0 bottom-0"
            style={
              {
                top: -480,
                backgroundImage: t.near,
                backgroundSize: '260px 480px',
                opacity: c.near,
                '--fall': '480px',
                '--d': '1.25s',
              } as TVars
            }
          />
        </div>
      </div>
      <div className="tg-a tg-sway absolute inset-0" style={{ '--sx': '-2%', '--d': '58s' } as TVars}>
        {BOKEH_NEAR.map((d) => (
          <Disc key={d.k} d={d} colors={c.colors} alpha={c.bokeh * 0.5} />
        ))}
      </div>
      {BEADS.map((b, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{ left: b.left, top: b.top, width: b.size, height: b.size, background: c.bead }}
        />
      ))}
      {RUNS.map((run) => (
        <div key={run.left} className="absolute" style={{ left: run.left, top: run.top }}>
          <span
            className="tg-a tg-trail absolute top-0 left-[2.5px] w-[2px]"
            style={{ height: run.ty, background: c.trail, '--d': run.d, animationDelay: run.delay } as TVars}
          />
          <span
            className="tg-a tg-slide absolute top-0 left-0 size-[7px] rounded-full"
            style={{ background: c.bead, '--ty': run.ty, '--d': run.d, animationDelay: run.delay } as TVars}
          />
        </div>
      ))}
    </>
  );
}

// Sunset: the sun half under a calm sea, two decks of cloud drifting at different heights and speeds, a path of
// glitter on the water and, once in a while, a few birds crossing.
const SUNSET = {
  dark: {
    sky: 'linear-gradient(180deg, #120821 0%, #2A1140 26%, #4E1B52 44%, #8E2F57 58%, #C9504B 66%, #EE8A55 70.5%, #F7B46A 72%)',
    far: 'radial-gradient(ellipse 16% 22% at 18% 62%, rgba(255,160,120,.3), transparent 70%), radial-gradient(ellipse 22% 26% at 20% 42%, rgba(70,24,78,.42), transparent 70%), radial-gradient(ellipse 14% 18% at 58% 60%, rgba(255,175,130,.26), transparent 70%), radial-gradient(ellipse 18% 22% at 60% 44%, rgba(78,26,84,.36), transparent 70%), radial-gradient(ellipse 12% 16% at 86% 58%, rgba(255,160,120,.22), transparent 70%), radial-gradient(ellipse 12% 18% at 86% 46%, rgba(70,24,78,.3), transparent 70%)',
    near: 'radial-gradient(ellipse 24% 22% at 26% 66%, rgba(255,120,130,.22), transparent 70%), radial-gradient(ellipse 30% 30% at 28% 44%, rgba(36,12,52,.5), transparent 70%), radial-gradient(ellipse 18% 18% at 74% 64%, rgba(255,130,120,.2), transparent 70%), radial-gradient(ellipse 22% 26% at 74% 46%, rgba(40,14,56,.45), transparent 70%)',
    haze: 'linear-gradient(180deg, transparent, rgba(255,170,110,.22) 50%, transparent)',
    bloom: 'radial-gradient(circle closest-side, rgba(255,170,100,.45), rgba(255,120,90,.16) 45%, transparent 100%)',
    sun: 'radial-gradient(circle closest-side, #FFF6DD 0 55%, #FFD596 78%, rgba(255,190,120,0) 100%)',
    sea: 'linear-gradient(180deg, rgba(240,140,90,.42) 0%, rgba(140,50,90,.28) 18%, transparent 55%), linear-gradient(180deg, #3B1A40 0%, #22102C 45%, #12091A 100%)',
    edge: 'rgba(255,220,180,.5)',
    glint: 'rgba(255,214,160,.75)',
    wave: 'rgba(255,170,130,.06)',
    bird: 'rgba(28,10,30,.7)',
  },
  light: {
    sky: 'linear-gradient(180deg, #FCEFE7 0%, #FCE4D8 32%, #FBD5C2 56%, #F9BB9B 67%, #F8A982 72%)',
    far: 'radial-gradient(ellipse 16% 22% at 18% 62%, rgba(255,196,170,.5), transparent 70%), radial-gradient(ellipse 22% 26% at 20% 42%, rgba(255,255,255,.75), transparent 70%), radial-gradient(ellipse 14% 18% at 58% 60%, rgba(255,200,170,.45), transparent 70%), radial-gradient(ellipse 18% 22% at 60% 44%, rgba(255,255,255,.65), transparent 70%), radial-gradient(ellipse 12% 16% at 86% 58%, rgba(255,196,170,.4), transparent 70%), radial-gradient(ellipse 12% 18% at 86% 46%, rgba(255,255,255,.6), transparent 70%)',
    near: 'radial-gradient(ellipse 24% 22% at 26% 66%, rgba(255,180,190,.38), transparent 70%), radial-gradient(ellipse 30% 30% at 28% 44%, rgba(255,255,255,.7), transparent 70%), radial-gradient(ellipse 18% 18% at 74% 64%, rgba(255,186,170,.34), transparent 70%), radial-gradient(ellipse 22% 26% at 74% 46%, rgba(255,255,255,.62), transparent 70%)',
    haze: 'linear-gradient(180deg, transparent, rgba(255,214,180,.5) 50%, transparent)',
    bloom: 'radial-gradient(circle closest-side, rgba(255,205,150,.6), rgba(255,175,140,.22) 45%, transparent 100%)',
    sun: 'radial-gradient(circle closest-side, #FFFDF5 0 55%, #FFE3B5 78%, rgba(255,214,160,0) 100%)',
    sea: 'linear-gradient(180deg, rgba(255,190,150,.55) 0%, rgba(240,180,190,.25) 25%, transparent 60%), linear-gradient(180deg, #E6C7CC 0%, #D8CBE0 45%, #CDCCE4 100%)',
    edge: 'rgba(255,255,255,.85)',
    glint: 'rgba(255,255,255,.9)',
    wave: 'rgba(120,90,150,.07)',
    bird: 'rgba(90,50,80,.5)',
  },
} as const;

const S_STARS = starField(29, 16, 2, 30, ['#FFFFFF', '#FFE9C4']);
const BIRDS = [
  { x: 0, y: 8, s: 1 },
  { x: 16, y: 2, s: 0.85 },
  { x: 30, y: 10, s: 0.9 },
  { x: 44, y: 4, s: 0.75 },
  { x: 54, y: 14, s: 0.8 },
];
const GLINT_MASK = 'radial-gradient(ellipse 50% 100% at 50% 0%, #000 15%, transparent 100%)';

function Sunset({ night }: { night: boolean }) {
  const c = night ? SUNSET.dark : SUNSET.light;
  const sun = 'clamp(14px, 11cqmin, 130px)';
  const bloom = 'clamp(80px, 70cqmin, 760px)';
  const glint = (stripe: string, d: string, delay: string) =>
    ({
      backgroundImage: `repeating-linear-gradient(180deg, ${c.glint} 0 1px, transparent 1px 5px)`,
      maskImage: `${GLINT_MASK}, repeating-linear-gradient(90deg, ${stripe})`,
      maskComposite: 'intersect',
      '--d': d,
      '--o0': 0.2,
      animationDelay: delay,
    }) as TVars;
  return (
    <>
      <div className="absolute inset-0" style={{ background: c.sky }} />
      {night ? <Stars sets={S_STARS} glow="rgba(255,233,196,.5)" /> : null}
      {night ? (
        <span
          className="absolute size-[3px] rounded-full bg-[#FFF4DC]"
          style={{ left: '17%', top: '15%', boxShadow: '0 0 8px 2px rgba(255,236,200,.45)' }}
        />
      ) : null}
      <div
        className="tg-a tg-breathe absolute rounded-full"
        style={
          {
            left: '64%',
            top: '72%',
            width: bloom,
            height: bloom,
            margin: `calc(${bloom} / -2)`,
            background: c.bloom,
            '--o0': 0.8,
            '--s1': 1.04,
            '--d': '10s',
          } as TVars
        }
      />
      <div
        className="tg-a tg-pan absolute top-[26%] left-0 h-[16%] w-[200%]"
        style={{ backgroundImage: c.near, backgroundSize: '50% 100%', '--d': '170s' } as TVars}
      />
      <div
        className="tg-a tg-pan absolute top-[49%] left-0 h-[14%] w-[200%]"
        style={{ backgroundImage: c.far, backgroundSize: '50% 100%', '--d': '260s' } as TVars}
      />
      <div className="absolute inset-x-0 top-[64%] h-[12%]" style={{ background: c.haze }} />
      <div
        className="absolute rounded-full"
        style={{ left: '64%', top: '72%', width: sun, height: sun, margin: `calc(${sun} / -2)`, background: c.sun }}
      />
      <div className="absolute inset-x-0 bottom-0 top-[72%] overflow-hidden" style={{ background: c.sea }}>
        <div
          className="tg-a tg-fall absolute inset-x-0 bottom-0"
          style={
            {
              top: -12,
              backgroundImage: `repeating-linear-gradient(180deg, transparent 0 11px, ${c.wave} 11px 12px)`,
              '--fall': '12px',
              '--d': '7s',
            } as TVars
          }
        />
        <div className="absolute inset-y-0 left-[64%] w-[clamp(22px,16cqmin,200px)] -translate-x-1/2">
          <div
            className="tg-a tg-twinkle absolute inset-0"
            style={glint('#000 0 9px, transparent 9px 15px', '2.6s', '0s')}
          />
          <div
            className="tg-a tg-twinkle absolute inset-0"
            style={glint('transparent 0 5px, #000 5px 11px, transparent 11px 13px', '3.4s', '-1.3s')}
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: c.edge }} />
      </div>
      <div
        className="tg-a tg-travel absolute"
        style={{ left: '-8%', top: '57%', '--tx': '118cqw', '--ty': '-7cqh', '--o1': 1, '--d': '80s' } as TVars}
      >
        <svg width="70" height="26" viewBox="0 0 70 26" fill="none" stroke={c.bird} strokeWidth={1.4}>
          {BIRDS.map((b, i) => (
            <path
              key={i}
              className="tg-a tg-flap"
              d={`M${b.x} ${b.y + 4}q${4 * b.s} ${-4 * b.s} ${8 * b.s} 0q${4 * b.s} ${-4 * b.s} ${8 * b.s} 0`}
              style={{ '--d': `${0.8 + i * 0.13}s`, animationDelay: `${-i * 0.31}s` } as TVars}
            />
          ))}
        </svg>
      </div>
    </>
  );
}

// Lava lamp: glossy wax rising off a warm base and sinking back, big drops near and small ones far, and tiny bubbles.
type TWax = 'volt' | 'violet' | 'pink' | 'amber';
const WAX: Record<'dark' | 'light', Record<TWax, readonly [string, string, string]>> = {
  dark: {
    volt: ['#A8FFD0', '#3DF58E', 'rgba(20,140,80,.85)'],
    violet: ['#D9CDFF', '#9F7BFF', 'rgba(80,50,200,.85)'],
    pink: ['#FFC7E1', '#FF6BB4', 'rgba(170,40,110,.85)'],
    amber: ['#FFE7AE', '#FFC53D', 'rgba(190,110,20,.85)'],
  },
  light: {
    volt: ['#E4FCEE', '#8BE8B4', 'rgba(64,190,120,.7)'],
    violet: ['#F0EBFF', '#B9A4FF', 'rgba(120,90,230,.62)'],
    pink: ['#FFE9F3', '#FFA9D0', 'rgba(220,90,150,.58)'],
    amber: ['#FFF3DB', '#FFCB80', 'rgba(225,140,50,.58)'],
  },
};
const BLOBS: { c: TWax; x: number; y: number; s: number; tx: string; ty: string; d: string; o: number }[] = [
  { c: 'violet', x: 70, y: 18, s: 36, tx: '-5cqw', ty: '50cqh', d: '58s', o: 1 },
  { c: 'volt', x: 14, y: 70, s: 30, tx: '6cqw', ty: '-48cqh', d: '46s', o: 1 },
  { c: 'pink', x: 82, y: 66, s: 22, tx: '-4cqw', ty: '-44cqh', d: '39s', o: 0.92 },
  { c: 'amber', x: 32, y: 86, s: 18, tx: '8cqw', ty: '-58cqh', d: '51s', o: 0.85 },
  { c: 'violet', x: 46, y: 74, s: 11, tx: '3cqw', ty: '-55cqh', d: '33s', o: 0.55 },
  { c: 'volt', x: 90, y: 22, s: 13, tx: '-6cqw', ty: '44cqh', d: '62s', o: 0.5 },
];
const BUBBLES = [18, 27, 39, 52, 61, 68, 77, 86].map((x, i) => ({
  left: `${x}%`,
  size: 3 + (i % 3) * 2,
  d: `${24 + ((i * 7) % 17)}s`,
  delay: `${-(i * 5.3) % 30}s`,
  tx: `${i % 2 ? 1.5 : -1.5}cqw`,
}));

const LAVA = {
  dark: {
    base: 'radial-gradient(ellipse 90% 55% at 50% 112%, rgba(255,120,60,.22), transparent 62%), radial-gradient(ellipse 80% 50% at 50% -12%, rgba(124,92,255,.16), transparent 62%), linear-gradient(180deg, #0B0714 0%, #0A0610 60%, #130812 100%)',
    wax: 0.62,
    glass: 'rgba(255,255,255,.045)',
    bubble: 'rgba(255,255,255,.35)',
  },
  light: {
    base: 'radial-gradient(ellipse 90% 55% at 50% 112%, rgba(255,170,110,.24), transparent 62%), radial-gradient(ellipse 80% 50% at 50% -12%, rgba(150,120,255,.13), transparent 62%), linear-gradient(180deg, #F6F2FB 0%, #F4EEF6 60%, #F8EDE6 100%)',
    wax: 0.85,
    glass: 'rgba(255,255,255,.55)',
    bubble: 'rgba(110,90,160,.3)',
  },
} as const;

function Lava({ night }: { night: boolean }) {
  const c = night ? LAVA.dark : LAVA.light;
  const wax = night ? WAX.dark : WAX.light;
  return (
    <>
      <div className="absolute inset-0" style={{ background: c.base }} />
      <div className="absolute inset-0" style={{ opacity: c.wax }}>
        {BLOBS.map((b, i) => {
          const [hi, mid, lo] = wax[b.c];
          return (
            <div
              key={i}
              className="tg-a tg-blob absolute rounded-full"
              style={
                {
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: `${b.s}cqmin`,
                  height: `${b.s}cqmin`,
                  margin: `${-b.s / 2}cqmin`,
                  opacity: b.o,
                  background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,.42), rgba(255,255,255,0) 20%), radial-gradient(circle at 62% 80%, rgba(255,255,255,.12), transparent 28%), radial-gradient(circle closest-side at 44% 40%, ${hi} 0%, ${mid} 52%, ${lo} 84%, transparent 100%)`,
                  '--tx': b.tx,
                  '--ty': b.ty,
                  '--d': b.d,
                  animationDelay: `${-i * 7}s`,
                } as TVars
              }
            />
          );
        })}
      </div>
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="tg-a tg-travel absolute bottom-[3%] rounded-full"
          style={
            {
              left: b.left,
              width: b.size,
              height: b.size,
              border: `1px solid ${c.bubble}`,
              '--tx': b.tx,
              '--ty': '-90cqh',
              '--o1': 0.8,
              '--d': b.d,
              animationDelay: b.delay,
            } as TVars
          }
        />
      ))}
      <div
        className="absolute inset-y-0 left-[5%] w-[7%]"
        style={{ background: `linear-gradient(90deg, transparent, ${c.glass}, transparent)` }}
      />
      <div
        className="absolute inset-y-0 right-[4%] w-[3%]"
        style={{ background: `linear-gradient(90deg, transparent, ${c.glass}, transparent)` }}
      />
    </>
  );
}

// Calm: a quiet wall with window light and the soft shadow of leaves. Nothing in it moves.
const LEAVES = (() => {
  const r = rng(71);
  let d = '';
  const branches: [number, number, number][] = [
    [0, 30, 0.5],
    [0, 150, 0.15],
    [60, 0, 0.9],
  ];
  for (const [bx, by, dir] of branches) {
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      const x = bx + Math.cos(dir) * 360 * t;
      const y = by + Math.sin(dir) * 360 * t + Math.sin(t * 4) * 18;
      const a = (dir * 180) / Math.PI + (i % 2 ? 50 : -50) + (r() - 0.5) * 30;
      const s = 0.8 + r() * 0.7;
      d += `<path d='M0 0Q14 -9 30 0Q14 9 0 0Z' transform='translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) scale(${s.toFixed(2)})'/>`;
    }
    d += `<path d='M${bx} ${by}L${(bx + Math.cos(dir) * 360).toFixed(1)} ${(by + Math.sin(dir) * 360).toFixed(1)}' stroke-width='3' fill='none'/>`;
  }
  return (fill: string) =>
    svgUrl(
      `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><g fill='${fill}' stroke='${fill}' stroke-width='0'>${d}</g></svg>`,
    );
})();

const CALM = {
  dark: {
    base: 'radial-gradient(ellipse 50% 45% at 90% 78%, rgba(255,180,110,.05), transparent 70%), linear-gradient(180deg, #0B0D13 0%, #08090E 100%)',
    pane: 'linear-gradient(160deg, rgba(160,178,255,.085), rgba(160,178,255,.03))',
    leaves: LEAVES('#06070B'),
    floor: 'linear-gradient(180deg, rgba(255,255,255,.035) 0, rgba(255,255,255,.012) 1px, rgba(0,0,0,.25) 100%)',
  },
  light: {
    base: 'radial-gradient(ellipse 50% 45% at 90% 78%, rgba(255,190,120,.12), transparent 70%), linear-gradient(180deg, #F5F2EC 0%, #EFEBE4 100%)',
    pane: 'linear-gradient(160deg, rgba(255,214,150,.5), rgba(255,232,195,.22))',
    leaves: LEAVES('#7A6A58'),
    floor: 'linear-gradient(180deg, rgba(60,45,30,.07) 0, rgba(60,45,30,.02) 1px, rgba(60,45,30,.05) 100%)',
  },
} as const;

function Calm({ night }: { night: boolean }) {
  const c = night ? CALM.dark : CALM.light;
  return (
    <>
      <div className="absolute inset-0" style={{ background: c.base }} />
      <div
        className="absolute grid grid-cols-2 gap-[1.6cqmin]"
        style={{
          left: '7%',
          top: '-6%',
          width: '40%',
          height: '84%',
          transform: 'skewX(-16deg) rotate(3deg)',
          maskImage: 'radial-gradient(ellipse 70% 72% at 42% 36%, #000 35%, transparent 100%)',
        }}
      >
        {[0, 1, 2, 3].map((k) => (
          <span key={k} style={{ background: c.pane }} />
        ))}
        <span
          className="absolute -inset-[6%] blur-[3px]"
          style={{ backgroundImage: c.leaves, backgroundSize: '100% 100%', opacity: night ? 0.85 : 0.22 }}
        />
      </div>
      <div className="absolute inset-x-0 top-[80%] bottom-0" style={{ background: c.floor }} />
    </>
  );
}

const HUSH: Record<TVibe, [number, number]> = {
  aurora: [0.42, 0.45],
  night: [0.3, 0.4],
  rain: [0.45, 0.45],
  sunset: [0.5, 0.5],
  lava: [0.55, 0.6],
  calm: [0.15, 0.15],
};

interface IVibeSceneProps {
  vibe: TVibe;
  night: boolean;
  motion: TVibeMotion;
  still: boolean;
  narrow?: boolean;
  topH?: number;
  tint?: string;
}

// One vibe with the finishing layers every vibe shares: a hush behind the clock so every face reads, the state tint,
// the top spotlight, the vignette and the grain. Sizes come from the scene's own box, so a preview is the same scene.
export const VibeScene = memo(function VibeScene({
  vibe,
  night,
  motion,
  still,
  narrow = false,
  topH = 64,
  tint,
}: IVibeSceneProps) {
  const frozen = still || motion === 'still';
  const h = HUSH[vibe][night ? 0 : 1];
  const hush = night ? `5,6,10` : `250,250,253`;
  return (
    <div
      className={cn(
        'tg-vibe absolute inset-0 overflow-hidden',
        frozen && 'tg-still',
        !frozen && motion === 'lively' && 'tg-lively',
      )}
      style={{ containerType: 'size' }}
    >
      {vibe === 'aurora' ? <Aurora night={night} /> : null}
      {vibe === 'night' ? <Night night={night} narrow={narrow} topH={topH} /> : null}
      {vibe === 'rain' ? <Rain night={night} /> : null}
      {vibe === 'sunset' ? <Sunset night={night} /> : null}
      {vibe === 'lava' ? <Lava night={night} /> : null}
      {vibe === 'calm' ? <Calm night={night} /> : null}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 36% 40% at 50% 46%, rgba(${hush},${h}) 0%, rgba(${hush},${(h * 0.6).toFixed(2)}) 45%, transparent 100%)`,
        }}
      />
      {tint ? (
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${tint}, transparent 70%)` }}
        />
      ) : null}
      <div
        className="absolute inset-x-[5%] top-[-35%] h-full"
        style={{
          background: `radial-gradient(ellipse 50% 50% at 50% 30%, ${night ? 'rgba(220,226,255,.05)' : 'rgba(255,255,255,.45)'}, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: night
            ? 'radial-gradient(ellipse 90% 80% at 50% 45%, transparent 55%, rgba(0,0,0,.5) 100%)'
            : 'radial-gradient(ellipse 90% 80% at 50% 45%, transparent 60%, rgba(40,44,70,.07) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: NOISE_URL,
          backgroundSize: '180px 180px',
          opacity: night ? 0.06 : 0.035,
          mixBlendMode: night ? 'overlay' : 'multiply',
        }}
      />
    </div>
  );
});
