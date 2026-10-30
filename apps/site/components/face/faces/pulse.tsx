import { alpha } from '../geometry';
import { card, type IDrawProps, L, lmin, MONO, nightAccent, nightClass } from '../kit';

const SCREEN = '#03080A';
const DIM = '#7D8A92';
const INK2 = '#A9B3C7';
const EDGE_MASK = 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)';
const HEART =
  'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';
const BEAT = [
  [40, 60],
  [48, 52],
  [56, 60],
  [66, 60],
  [72, 70],
  [80, 12],
  [88, 96],
  [94, 60],
  [106, 60],
  [116, 48],
  [128, 60],
  [160, 60],
] as const;
// Four heartbeats, 160 px apart, so the trace can slide one beat and loop.
const TRACE = Array.from({ length: 4 }, (_, k) => {
  const o = k * 160;
  return `${k ? ' L' : 'M'}${o} 60${BEAT.map(([x, y]) => ` L${o + x} ${y}`).join('')}`;
}).join('');

// A heart-monitor trace sweeps while the screen is awake.
export default function Pulse({ m }: IDrawProps) {
  const acc = nightAccent(m);
  const grid = alpha(acc, 0x14);
  return (
    <div
      className={nightClass(m)}
      style={card(m, {
        borderRadius: 28,
        backgroundColor: SCREEN,
        backgroundImage: `repeating-linear-gradient(0deg, ${grid} 0 1px, transparent 1px 16px), repeating-linear-gradient(90deg, ${grid} 0 1px, transparent 1px 16px)`,
      })}
    >
      <div
        className={L}
        style={{
          position: 'absolute',
          left: 22,
          right: 22,
          top: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: MONO,
          fontSize: lmin(12),
          letterSpacing: '.12em',
          color: acc,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg className="afx-breath" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d={HEART} style={{ fill: acc }} />
          </svg>
          {m.capText.toUpperCase()}
        </span>
        <span style={{ color: DIM }}>{Math.round(m.total / 60)} MIN SESSION</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 52,
          width: 332,
          height: 110,
          overflow: 'hidden',
          WebkitMaskImage: EDGE_MASK,
          maskImage: EDGE_MASK,
        }}
      >
        <svg
          className="afx-ecg"
          style={{ position: 'absolute', left: 0, top: 0, filter: `drop-shadow(0 0 6px ${acc})` }}
          width="640"
          height="110"
          viewBox="0 0 640 110"
          aria-hidden="true"
        >
          <path
            d={TRACE}
            fill="none"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={m.live || m.st === 'idle' ? 1 : 0.35}
            style={{ stroke: acc }}
          />
        </svg>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 22,
          right: 22,
          bottom: 22,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <span className={L} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: MONO, fontSize: lmin(12), letterSpacing: '.14em', color: DIM }}>{m.topWord}</span>
          <span style={{ fontSize: lmin(13), color: INK2 }}>{m.endLine}</span>
        </span>
        <span
          style={{
            fontSize: 64,
            fontWeight: 300,
            letterSpacing: '-0.04em',
            lineHeight: 0.9,
            color: acc,
            textShadow: `0 0 22px ${alpha(acc, 0x40)}`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
      </div>
    </div>
  );
}
