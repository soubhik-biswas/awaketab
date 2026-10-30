import { NAVY, WHITE } from '../art';
import '../face-art.css';
import { f1 } from '../geometry';
import { big, EndLine, type IDrawProps, Kicker, L, lmin, MONO, Svg } from '../kit';

// Sand falls from top to bottom as the session runs; a fine stream moves while awake.
export default function Hourglass({ m }: IDrawProps) {
  const { t, accent } = m;
  const ft = m.ringFrac;
  const topY = 44 + 108 * (1 - ft);
  const wTop = 52 * ft;
  const bh = 70 * (1 - ft);
  return (
    <>
      <Svg>
        <rect x="44" y="34" width="132" height="10" rx="5" style={{ fill: t.ink }} />
        <rect x="44" y="266" width="132" height="10" rx="5" style={{ fill: t.ink }} />
        <path
          d="M58 44 H162 L116 152 L162 266 H58 L104 152 Z"
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ fill: m.theme === 'light' ? NAVY(0.03) : WHITE(0.03), stroke: t.line }}
        />
        {ft > 0.01 && (
          <path d={`M${f1(110 - wTop)} ${f1(topY)} H${f1(110 + wTop)} L112 148 H108 Z`} style={{ fill: accent }} />
        )}
        {bh > 1 && <path d={`M62 264 Q110 ${f1(264 - bh * 1.6)} 158 264 Z`} opacity=".85" style={{ fill: accent }} />}
        <line
          className="afx-stream"
          x1="110"
          y1="152"
          x2="110"
          y2={f1(264 - bh * 0.8)}
          strokeWidth="2.5"
          strokeDasharray="6 6"
          opacity={m.liveOp}
          style={{ stroke: accent }}
        />
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
          {m.pctLabel} remaining
        </span>
      </div>
    </>
  );
}
