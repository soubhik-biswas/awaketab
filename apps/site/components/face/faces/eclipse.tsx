import { card, digitSize, type IDrawProps, L, lmin, Stars, type TStar } from '../kit';

const SKY = 'radial-gradient(80% 60% at 50% 40%, #0B0D1C, #010207 70%)';
const CORONA =
  'radial-gradient(circle, rgba(255,244,220,.95) 0, rgba(255,214,160,.45) 26%, rgba(159,123,255,.18) 44%, transparent 62%)';
const SUN = 'radial-gradient(circle at 45% 40%, #FFFFFF, #FFF1CF 55%, #FFD999 100%)';
const MOON = 'radial-gradient(circle at 40% 35%, #10131F, #020309 70%)';
const INK2 = '#B9C2D6';
const STARS: readonly TStar[] = [
  [20, 30],
  [60, 200],
  [300, 40],
  [280, 210],
  [40, 120],
  [310, 130],
  [150, 230],
  [240, 250],
  [90, 20],
  [200, 14],
  [16, 250],
  [320, 260],
];

// The moon slides across the sun; totality arrives when time is up.
export default function Eclipse({ m }: IDrawProps) {
  const covered = m.st === 'idle' ? 0 : 1 - m.frac;
  return (
    <div style={card(m, { background: SKY })}>
      <Stars pts={STARS} colors={['#FFFFFF']} step={0.4} />
      <div
        className="afx-breath"
        style={{
          position: 'absolute',
          left: 36,
          top: -24,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: CORONA,
          opacity: Number((0.3 + 0.7 * covered).toFixed(2)),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 34,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: SUN,
          boxShadow: '0 0 40px rgba(255,220,160,.6)',
        }}
      />
      <div
        className="af-tr"
        style={{
          position: 'absolute',
          left: Math.round(93 - 220 * (1 - covered)),
          top: 31,
          width: 146,
          height: 146,
          borderRadius: '50%',
          background: MOON,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.04)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: 170,
          top: 35,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 0 18px 6px rgba(255,250,235,.9)',
          opacity: covered > 0.92 ? 1 : 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 196,
          width: 332,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          color: '#FFFFFF',
        }}
      >
        <span
          style={{
            fontSize: digitSize(m, 'sm'),
            fontWeight: 300,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontSize: lmin(13), color: INK2 }}>
          {m.endLine} · {Math.round(covered * 100)}% covered
        </span>
      </div>
    </div>
  );
}
