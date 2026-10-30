import { useId } from 'react';
import { NAVY, WHITE } from '../art';
import { alpha, f1 } from '../geometry';
import { big, EndLine, type IDrawProps, Kicker, L, lmin, MONO, Svg } from '../kit';

const BULB = 'M66 42 H154 C154 98 117 126 114 155 C117 184 154 212 154 268 H66 C66 212 103 184 106 155 C103 126 66 98 66 42 Z';
const TOP_CLIP = 'M66 42 H154 C154 98 117 126 114 155 H106 C103 126 66 98 66 42 Z';
const BOTTOM_CLIP = 'M106 155 C103 184 66 212 66 268 H154 C154 212 117 184 114 155 Z';
const CAP = { light: ['#C9CBD8', '#F4F4FA'], night: ['#2B3550', '#55617E'] } as const;
const GLASS_LINE = { light: NAVY(0.28), night: 'rgba(220,230,255,.32)' };
const GRAINS = [
  [96, 0.5, 1.2],
  [104, 0.8, 1],
  [117, 0.65, 1.2],
  [124, 0.35, 1],
  [88, 0.3, 1],
  [132, 0.25, 1.1],
  [110, 0.95, 1],
  [100, 0.2, 1],
] as const;

// Sand falls from top to bottom as the session runs; a fine stream moves while awake.
export default function Hourglass({ m }: IDrawProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  const { t, accent } = m;
  const ft = m.ringFrac;
  const hi = m.heat(m.frac);
  const lo = alpha(hi, 0xb0);
  const topY = 50 + 100 * (1 - ft);
  const dip = ft > 0.02 ? Math.min(16, 6 + 14 * (1 - ft)) : 0;
  const edge = `M60 ${f1(topY)} Q110 ${f1(topY + dip * 2)} 160 ${f1(topY)}`;
  const pile = 96 * (1 - ft);
  const y = (k: number) => f1(270 - pile * k);
  const bottom = `M58 270 V${y(0.42)} C80 ${y(0.6)} 96 ${y(1.15)} 110 ${y(1.15)} C124 ${y(1.15)} 140 ${y(0.6)} 162 ${y(0.42)} V270 Z`;
  const cap = m.night ? CAP.night : CAP.light;
  const ids = { top: `af-hg-t${id}`, bot: `af-hg-b${id}`, sand: `af-hg-s${id}`, wood: `af-hg-w${id}`, glow: `af-hg-g${id}` };
  return (
    <>
      <Svg>
        <defs>
          <clipPath id={ids.top}>
            <path d={TOP_CLIP} />
          </clipPath>
          <clipPath id={ids.bot}>
            <path d={BOTTOM_CLIP} />
          </clipPath>
          <linearGradient id={ids.sand} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: hi }} />
            <stop offset="1" style={{ stopColor: lo }} />
          </linearGradient>
          <linearGradient id={ids.wood} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: cap[0] }} />
            <stop offset=".5" style={{ stopColor: cap[1] }} />
            <stop offset="1" style={{ stopColor: cap[0] }} />
          </linearGradient>
          <radialGradient id={ids.glow} cx="50%" cy="50%" r="50%">
            <stop offset="0" style={{ stopColor: accent, stopOpacity: 0.28 }} />
            <stop offset="1" style={{ stopColor: accent, stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <ellipse cx="110" cy="214" rx="70" ry="60" fill={`url(#${ids.glow})`} opacity={m.liveOp} />
        <rect x="46" y="38" width="6" height="234" rx="3" fill={`url(#${ids.wood})`} />
        <rect x="168" y="38" width="6" height="234" rx="3" fill={`url(#${ids.wood})`} />
        <path d={BULB} style={{ fill: m.theme === 'light' ? NAVY(0.03) : WHITE(0.03) }} />
        <g clipPath={`url(#${ids.top})`}>
          {ft > 0.01 && (
            <>
              <path className="af-tr" d={`${edge} V160 H60 Z`} fill={`url(#${ids.sand})`} />
              <path d={edge} fill="none" strokeWidth="1.5" opacity=".9" style={{ stroke: hi }} />
            </>
          )}
        </g>
        <g clipPath={`url(#${ids.bot})`}>
          {pile > 1 && <path className="af-tr" d={bottom} fill={`url(#${ids.sand})`} />}
          {pile > 6 &&
            GRAINS.map(([x, k, r]) => <circle key={x} cx={x} cy={y(k)} r={r} opacity=".7" style={{ fill: lo }} />)}
        </g>
        <line
          className="afx-stream"
          x1="110"
          y1="150"
          x2="110"
          y2={f1(268 - 96 * (1 - ft) * 1.15)}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="3 5"
          opacity={m.live && ft > 0.01 && ft < 0.999 ? 1 : 0}
          style={{ stroke: hi }}
        />
        <path
          d={BULB}
          fill="none"
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ stroke: m.night ? GLASS_LINE.night : GLASS_LINE.light }}
        />
        <path d="M74 52 C76 92 96 118 104 140" fill="none" strokeWidth="3" strokeLinecap="round" stroke={WHITE(0.28)} />
        <path d="M76 258 C78 226 92 196 102 176" fill="none" strokeWidth="3" strokeLinecap="round" stroke={WHITE(0.16)} />
        <rect x="38" y="26" width="144" height="16" rx="6" fill={`url(#${ids.wood})`} />
        <rect x="38" y="268" width="144" height="16" rx="6" fill={`url(#${ids.wood})`} />
        <rect x="38" y="26" width="144" height="3" rx="1.5" fill={WHITE(0.22)} />
        <rect x="38" y="268" width="144" height="3" rx="1.5" fill={WHITE(0.22)} />
      </Svg>
      <div
        style={{
          position: 'absolute',
          left: 196,
          top: 0,
          width: 150,
          height: 310,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Kicker m={m} />
        <span style={big(m.long ? 40 : 52)}>{m.digits}</span>
        <EndLine m={m} px={14} />
        <span className={L} style={{ marginTop: 8, fontFamily: MONO, fontSize: lmin(12), color: accent }}>
          {m.pctLabel} sand left
        </span>
      </div>
    </>
  );
}
