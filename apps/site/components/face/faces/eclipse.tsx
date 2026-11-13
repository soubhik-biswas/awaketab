import { fxInk, fxInk2 } from '../art';
import { card, D, digitSize, type IDrawProps, L, lmin, Stars, type TStar, PLATE } from '../kit';

// A bright sky, a slate moon and an amber corona by day; a night sky at night.
const ART = {
  light: {
    sky: 'radial-gradient(80% 60% at 50% 40%, #FFFFFF, #E7EAF4 70%)',
    // The sky darkens overhead toward totality while the horizon stays bright, as it does in a real eclipse.
    dusk: 'linear-gradient(180deg, rgba(30,38,74,.46) 0%, rgba(30,38,74,.2) 34%, rgba(30,38,74,0) 63%)',
    corona:
      'radial-gradient(circle, rgba(255,214,150,.95) 0, rgba(255,180,90,.45) 26%, rgba(102,51,245,.12) 44%, transparent 62%)',
    ray: [255, 196, 120, 0.5],
    moon: 'radial-gradient(circle at 40% 35%, #3A4158, #1B2030 70%)',
    bead: '#FFF6E0',
    beadGlow: 'rgba(255,170,60,.85)',
    sunGlow: '0 0 0 1px rgba(214,150,50,.22), 0 0 40px rgba(255,190,110,.55)',
  },
  night: {
    sky: 'radial-gradient(80% 60% at 50% 40%, #0B0D1C, #010207 70%)',
    dusk: 'linear-gradient(180deg, rgba(0,0,4,.55) 0%, rgba(0,0,4,.25) 34%, rgba(0,0,4,0) 63%)',
    corona:
      'radial-gradient(circle, rgba(255,244,220,.95) 0, rgba(255,214,160,.45) 26%, rgba(159,123,255,.18) 44%, transparent 62%)',
    ray: [255, 240, 215, 0.42],
    moon: 'radial-gradient(circle at 40% 35%, #10131F, #020309 70%)',
    bead: '#FFFFFF',
    beadGlow: 'rgba(255,250,235,.9)',
    sunGlow: '0 0 40px rgba(255,220,160,.6)',
  },
} as const;
// Limb darkening: the sun is whitest at its centre and warmer toward its edge.
const SUN = 'radial-gradient(circle at 45% 40%, #FFFFFF, #FFF8E6 38%, #FFF1CF 62%, #FFE2AE 88%, #FFD48F 100%)';
// The pink rim of the chromosphere, seen only in totality.
const CHROMOSPHERE = '0 0 0 1.5px rgba(255,96,132,.55), 0 0 8px 1px rgba(255,96,132,.32)';
const STARS: readonly TStar[] = [
  [20, 30],
  [60, 200],
  [300, 40],
  [280, 210],
  [40, 120],
  [310, 130],
  [300, 176],
  [292, 248],
  [90, 20],
  [200, 14],
  [16, 250],
  [320, 260],
];
// Uneven streamers, wider along the sun's equator, as long-exposure photographs show them.
const RAYS: readonly (readonly [number, number, number])[] = [
  [0, 12, 26],
  [38, 54, 70],
  [78, 96, 116],
  [136, 150, 162],
  [176, 190, 212],
  [228, 246, 262],
  [268, 286, 312],
  [326, 338, 352],
];
const rays = ([r, g, b, a]: readonly [number, number, number, number]): string => {
  const on = `rgba(${r},${g},${b},${a})`;
  const off = `rgba(${r},${g},${b},0)`;
  return `conic-gradient(from 6deg, ${RAYS.map(([s, p, e]) => `${off} ${s}deg, ${on} ${p}deg, ${off} ${e}deg`).join(', ')})`;
};
const RAY_MASK = 'radial-gradient(circle, transparent 0 66px, #000 72px, rgba(0,0,0,.45) 104px, transparent 150px)';
const clamp = (n: number): number => Math.min(1, Math.max(0, n));

// The moon slides across the sun; totality arrives when time is up. Night sky in dark, bright sky in light.
export default function Eclipse({ m }: IDrawProps) {
  const light = !m.night;
  const a = light ? ART.light : ART.night;
  const covered = m.st === 'idle' ? 0 : 1 - m.frac;
  // The moon covers the sun whole once its centre is within 3 px of the sun's.
  const total = covered >= 0.979;
  // Paused, blocked and unsupported name their state, since the sky alone would look awake.
  const halted = m.st === 'paused' || m.st === 'blocked' || m.st === 'unsupported';
  const word = m.topWord.charAt(0).toUpperCase() + m.topWord.slice(1);
  const pct = m.total > 0 && !m.indef && m.st !== 'idle' ? ` · ${Math.round(covered * 100)}% covered` : '';
  return (
    <div className={PLATE} style={card(m, { background: a.sky })}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: a.dusk,
          opacity: Number(covered.toFixed(2)),
        }}
      />
      {m.night && (
        <div style={{ position: 'absolute', inset: 0, opacity: Number((0.45 + 0.55 * covered).toFixed(2)) }}>
          <Stars pts={STARS} colors={['#FFFFFF']} step={0.4} />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          left: 36,
          top: -32,
          width: 260,
          height: 260,
          opacity: Number((0.3 + 0.7 * covered).toFixed(2)),
        }}
      >
        <div
          className="afx-breath"
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: a.corona }}
        />
      </div>
      <div
        className={D}
        style={{
          position: 'absolute',
          left: 16,
          top: -52,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: rays(a.ray),
          WebkitMaskImage: RAY_MASK,
          maskImage: RAY_MASK,
          opacity: Number((covered ** 3).toFixed(2)),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 28,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: SUN,
          boxShadow: a.sunGlow,
        }}
      />
      <div
        className="af-tr"
        style={{
          position: 'absolute',
          // From first contact with the sun's edge (-50) to totality (93), so the overlap matches the percentage; it
          // passes 2 px low, so the last light shows at the upper right.
          left: Math.round(-50 + 143 * covered),
          top: 27,
          width: 146,
          height: 146,
          borderRadius: '50%',
          background: a.moon,
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,.05)${total ? `, ${CHROMOSPHERE}` : ''}`,
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: 219,
          top: 54,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: a.bead,
          boxShadow: `0 0 18px 6px ${a.beadGlow}`,
          // The diamond ring: the last bead of sunlight, gone once totality begins.
          opacity: covered >= 1 ? 0 : Number(clamp((covered - 0.94) / 0.03).toFixed(2)),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 182,
          width: 332,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: fxInk(light),
        }}
      >
        <span
          style={{
            fontSize: digitSize(m, 'sm'),
            fontWeight: 300,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            ...(m.st === 'up' ? { color: fxInk2(light) } : {}),
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontSize: lmin(13), color: fxInk2(light), whiteSpace: 'nowrap' }}>
          {halted ? (
            <>
              <span style={{ color: m.accent, fontWeight: 600 }}>{word}</span> · {m.endLine}
            </>
          ) : (
            `${m.endLine}${pct}`
          )}
        </span>
      </div>
    </div>
  );
}
