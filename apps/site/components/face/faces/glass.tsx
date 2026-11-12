import { BLACK, WHITE } from '../art';
import { alpha } from '../geometry';
import { card, digitSize, type IDrawProps, L, lmin, MONO, PLATE } from '../kit';

// Pastel orbs by day, deep ones at night.
const MINT = '#6FDDA0';
const VIOLET = { light: '#B29CFF', night: '#7B5CFF' };
const CYAN = { light: '#8FD3FF', night: '#3FB8FF' };
const GROUND = { light: 'linear-gradient(160deg, #F4F5FB, #E7E9F4)', night: '#070A16' };
const PANE = { light: WHITE(0.42), night: WHITE(0.09) };
const PANE_LINE = { light: WHITE(0.8), night: WHITE(0.2) };
const INK = { light: '#0B1020', night: '#FFFFFF' };

const orb = (left: number, top: number, d: number, background: string) =>
  ({ position: 'absolute', left, top, width: d, height: d, borderRadius: '50%', background }) as const;

// A frosted pane floats over soft colour orbs; the time sits on the glass.
export default function Glass({ m }: IDrawProps) {
  const k = m.night ? 'night' : 'light';
  const a1 = m.multi ? (m.night ? m.lamp : MINT) : m.accent;
  const a2 = m.multi ? VIOLET[k] : alpha(m.accent, 0x99);
  const a3 = m.multi ? CYAN[k] : m.t.track;
  return (
    <div className={PLATE} style={card(m, { background: GROUND[k] })}>
      <div className="afx-float" style={orb(-10, -20, 190, a1)} />
      <div className="afx-float" data-delay="-3" style={orb(180, 120, 200, a2)} />
      <div style={orb(210, 18, 70, a3)} />
      <div
        style={{
          position: 'absolute',
          left: 30,
          top: 50,
          width: 272,
          height: 182,
          borderRadius: 32,
          background: PANE[k],
          backdropFilter: 'blur(24px) saturate(170%)',
          WebkitBackdropFilter: 'blur(24px) saturate(170%)',
          border: `1px solid ${PANE_LINE[k]}`,
          boxShadow: `inset 0 1px 0 ${WHITE(0.35)}, 0 20px 40px ${BLACK(0.18)}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          color: INK[k],
        }}
      >
        <span
          className={L}
          style={{
            fontFamily: MONO,
            fontSize: lmin(12),
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            opacity: 0.75,
          }}
        >
          {m.topWord}
        </span>
        <span
          style={{
            fontSize: digitSize(m, 'mid'),
            fontWeight: 300,
            letterSpacing: '-0.045em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontSize: lmin(14), opacity: 0.8 }}>
          {m.endLine}
        </span>
      </div>
    </div>
  );
}
