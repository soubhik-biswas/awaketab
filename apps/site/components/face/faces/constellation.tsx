import { BLACK, CARD_SHADOW, fxInk, fxInk2, NAVY, type TThemed } from '../art';
import { f1 } from '../geometry';
import { card, D, type IDrawProps, Kicker, L, lmin, PLATE } from '../kit';

interface IChart {
  sky: (acc: string) => string;
  major: string;
  minor: string;
  field: string;
  dim: string;
}

// A printed star atlas on porcelain paper by day; a dark-sky chart whose stars glow at night.
const ART: TThemed<IChart> = {
  light: {
    sky: () =>
      'radial-gradient(110% 80% at 16% 0%, #FFFFFF 0%, transparent 58%), linear-gradient(168deg, #F9F9F6 0%, #EEEEE9 100%)',
    major: 'rgba(29,95,184,.2)',
    minor: 'rgba(29,95,184,.085)',
    field: '#4B5165',
    dim: '#A3A9BA',
  },
  dark: {
    sky: (acc) =>
      `radial-gradient(80% 60% at 74% 22%, rgba(159,123,255,.1), transparent 62%), radial-gradient(70% 55% at 16% 84%, color-mix(in srgb, ${acc} 7%, transparent), transparent 66%), radial-gradient(130% 100% at 50% 0%, #0B1024 0%, #02030A 72%)`,
    major: 'rgba(124,187,255,.15)',
    minor: 'rgba(124,187,255,.065)',
    field: '#C5CEE0',
    dim: '#3A425A',
  },
  oled: {
    sky: () => '#000000',
    major: 'rgba(124,187,255,.12)',
    minor: 'rgba(124,187,255,.05)',
    field: '#AEB8CC',
    dim: '#2E3448',
  },
};
const INK = '#0B1020';

// One star per thirtieth of the session, chained like a serpent constellation; the third value is its magnitude.
const CHAIN = [
  [33.5, 151.3, 2.1],
  [51.2, 160.3, 3.4],
  [67.4, 161.4, 4.2],
  [77.9, 165.4, 1.6],
  [98.8, 162.1, 3.8],
  [110.3, 156.1, 2.9],
  [120.2, 144.5, 4.5],
  [134.2, 130.5, 3.1],
  [144.9, 124.1, 0.9],
  [147.3, 106.9, 3.6],
  [136.1, 93.2, 4.4],
  [134.3, 80.6, 2.5],
  [148.9, 74.9, 3.9],
  [160.7, 65, 1.9],
  [175.2, 64.6, 4.1],
  [190.9, 78.8, 3.3],
  [202, 84.4, 2.7],
  [211.5, 96.3, 4.6],
  [213.7, 115.4, 1.2],
  [214.5, 128.5, 3.5],
  [231.6, 137.4, 4],
  [247.5, 143.8, 2.3],
  [256.3, 147.7, 3.7],
  [276.3, 142.4, 4.3],
  [287.3, 132.7, 1.8],
  [290.9, 121.7, 3],
  [299.9, 102.8, 4.4],
  [300.4, 89.1, 2.6],
  [283.3, 83.1, 3.8],
  [268.9, 71.5, 1.4],
] as const;
const CS = CHAIN.length;
// Atlas sizing: each magnitude brighter adds one step of disc, so brightness reads on the eye's log scale.
const disc = (mag: number): number => 1.8 + (5 - mag) * 1.1;

const halton = (i: number, b: number): number => {
  let f = 1;
  let r = 0;
  for (let n = i; n > 0; n = Math.floor(n / b)) {
    f /= b;
    r += f * (n % b);
  }
  return r;
};
const dotPath = (x: number, y: number, r: number): string =>
  `M${f1(x - r)} ${f1(y)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
// Faint background stars, spread evenly and kept clear of the chain.
const FIELD = Array.from(
  { length: 52 },
  (_, i) => [16 + 300 * halton(i + 1, 2), 50 + 152 * halton(i + 1, 3), i] as const,
)
  .filter(([x, y]) => CHAIN.every(([a, b]) => Math.hypot(a - x, b - y) > 9))
  .reduce(
    (acc, [x, y, i]) => {
      if (halton(i + 1, 5) < 0.3) acc.bright += dotPath(x, y, 0.95);
      else acc.faint += dotPath(x, y, 0.6);
      return acc;
    },
    { bright: '', faint: '' },
  );

// An equidistant conic projection: parallels are arcs about a pole above the chart, meridians run out from it.
const POLE_X = 166;
const POLE_Y = -520;
const parallel = (rr: number): string => {
  const y = f1(POLE_Y + Math.sqrt(rr * rr - 176 * 176));
  return `M-10 ${y}A${rr} ${rr} 0 0 0 342 ${y}`;
};
const meridian = (deg: number): string => {
  const q = (deg * Math.PI) / 180;
  const [s, c] = [Math.sin(q), Math.cos(q)];
  return `M${f1(POLE_X + 480 * s)} ${f1(POLE_Y + 480 * c)}L${f1(POLE_X + 840 * s)} ${f1(POLE_Y + 840 * c)}`;
};
const grid = (major: boolean): string =>
  Array.from({ length: 10 }, (_, j) => j + 1)
    .filter((j) => (j % 2 === 0) === major)
    .map((j) => parallel(520 + 28 * j))
    .join('') +
  Array.from({ length: 17 }, (_, n) => n - 8)
    .filter((n) => (n % 3 === 0) === major)
    .map((n) => meridian(n * 2))
    .join('');
const MAJOR = grid(true);
const MINOR = grid(false);
const ECLIPTIC = 'M-10 206C90 120 220 30 342 58';
const GRID_MASK = 'linear-gradient(180deg, transparent 0 8%, #000 20% 58%, transparent 74%)';

// Each star is a share of the time left; the lit stars join into a constellation that fades from its far end.
export default function Constellation({ m }: IDrawProps) {
  const light = !m.night;
  const a = ART[m.theme];
  const acc = m.accent;
  const lit = Math.round(m.ringFrac * CS);
  // A small tile scales the sky down; stars and lines grow so the figure still reads at that size.
  const k = Math.min(3, Math.max(1, 200 / m.size));
  const stars = CHAIN.map(([x, y, mag], i) => ({ x, y, d: disc(mag) * k, bright: mag < 2, on: i < lit }));
  // Lines stop short of each star, as an atlas draws them.
  let litPath = '';
  let pastPath = '';
  for (let i = 1; i < CS; i++) {
    const p = stars[i - 1];
    const q = stars[i];
    if (!p || !q) continue;
    const len = Math.hypot(q.x - p.x, q.y - p.y);
    const gp = p.d / 2 + 1.6 * k;
    const gq = q.d / 2 + 1.6 * k;
    if (len <= gp + gq + 1) continue;
    const ux = (q.x - p.x) / len;
    const uy = (q.y - p.y) / len;
    const s = `M${f1(p.x + ux * gp)} ${f1(p.y + uy * gp)}L${f1(q.x - ux * gq)} ${f1(q.y - uy * gq)}`;
    if (q.on) litPath += s;
    else pastPath += s;
  }
  const now = lit > 0 ? stars[lit - 1] : undefined;
  const ring = now ? now.d + 10 * k : 0;
  return (
    <div
      className={PLATE}
      style={card(m, {
        background: a.sky(acc),
        boxShadow: `${CARD_SHADOW[m.theme]}, inset 0 0 70px ${light ? NAVY(0.05) : BLACK(0.55)}`,
      })}
    >
      <svg
        className={D}
        style={{ position: 'absolute', left: 0, top: 0, WebkitMaskImage: GRID_MASK, maskImage: GRID_MASK }}
        width="332"
        height="282"
        viewBox="0 0 332 282"
        aria-hidden="true"
      >
        <path d={MINOR} fill="none" strokeWidth=".6" style={{ stroke: a.minor }} />
        <path d={MAJOR} fill="none" strokeWidth=".8" style={{ stroke: a.major }} />
        <path
          d={ECLIPTIC}
          fill="none"
          strokeWidth=".8"
          strokeDasharray="3 4"
          opacity=".3"
          style={{ stroke: m.tone.violet }}
        />
        <path d={FIELD.faint} opacity=".35" style={{ fill: a.field }} />
        <path d={FIELD.bright} opacity=".6" style={{ fill: a.field }} />
      </svg>
      <svg
        style={{ position: 'absolute', left: 0, top: 0 }}
        width="332"
        height="282"
        viewBox="0 0 332 282"
        aria-hidden="true"
      >
        <path
          d={pastPath}
          fill="none"
          strokeWidth={f1(k)}
          strokeDasharray={`${f1(2 * k)} ${f1(3 * k)}`}
          style={{ stroke: a.dim }}
        />
        <path
          d={litPath}
          fill="none"
          strokeWidth={f1(1.2 * k)}
          strokeLinecap="round"
          opacity={light ? 0.85 : 0.7}
          style={{ stroke: acc }}
        />
      </svg>
      {!light &&
        stars.map(({ x, y, d, bright, on }, i) => {
          if (!on || !bright) return null;
          const s = d * 4.4;
          return (
            <span
              key={`g${String(i)}`}
              className={`afx-twinkle ${D}`}
              data-delay={((i * 0.7) % 3.6).toFixed(1)}
              style={{
                position: 'absolute',
                left: `${f1(x - s / 2)}px`,
                top: `${f1(y - s / 2)}px`,
                width: s,
                height: s,
                borderRadius: '50%',
                opacity: 0.7,
                background: `radial-gradient(circle closest-side, color-mix(in srgb, ${acc} 32%, transparent), transparent)`,
              }}
            />
          );
        })}
      {stars.map(({ x, y, d, on }, i) => {
        // Lit stars glow from a white core at night and print as solid ink by day; spent stars stay as faint marks.
        const s = on ? (light ? d : d * 2) : light ? Math.max(2.4 * k, d * 0.75) : Math.max(1.6 * k, d * 0.55);
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${f1(x - s / 2)}px`,
              top: `${f1(y - s / 2)}px`,
              width: s,
              height: s,
              borderRadius: '50%',
              background: on
                ? light
                  ? INK
                  : `radial-gradient(circle closest-side, #FFFFFF 0 40%, color-mix(in srgb, ${acc} 70%, #FFFFFF) 50%, color-mix(in srgb, ${acc} 30%, transparent) 70%, transparent)`
                : light
                  ? 'transparent'
                  : a.dim,
              border: !on && light ? `1px solid ${a.dim}` : undefined,
            }}
          />
        );
      })}
      {now && (
        <>
          <span
            style={{
              position: 'absolute',
              left: `${f1(now.x - ring / 2)}px`,
              top: `${f1(now.y - ring / 2)}px`,
              width: ring,
              height: ring,
              borderRadius: '50%',
              border: `1px solid ${acc}`,
              opacity: 0.85,
            }}
          />
          <span
            className="afx-pulse"
            style={{
              position: 'absolute',
              left: `${f1(now.x - ring / 2)}px`,
              top: `${f1(now.y - ring / 2)}px`,
              width: ring,
              height: ring,
              borderRadius: '50%',
              border: `1.5px solid ${acc}`,
              opacity: m.haloOp,
            }}
          />
        </>
      )}
      <div
        style={{
          position: 'absolute',
          left: 28,
          top: 22,
          width: 276,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          lineHeight: 1.2,
        }}
      >
        <Kicker m={m} color={acc} />
        <span
          className={L}
          style={{ fontSize: lmin(12), color: fxInk2(light), fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
        >
          {lit} of {CS} stars
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: 332,
          bottom: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          color: fxInk(light),
        }}
      >
        <span
          style={{
            fontSize: 46,
            fontWeight: 300,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontSize: lmin(13), color: fxInk2(light) }}>
          {m.endLine}
        </span>
      </div>
    </div>
  );
}
