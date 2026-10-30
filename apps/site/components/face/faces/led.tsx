import { BLACK, WHITE } from '../art';
import { DOT } from '../fonts';
import { alpha } from '../geometry';
import type { IDrawProps } from '../kit';

const PANEL = '#06080C';
const PANEL_LINE = '#1C2330';
const RULE = '#141A24';
const DOT_OFF = '#1A2130';
const ND = 24;
const EDGE_MASK = 'linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)';

// Dot-matrix board with a scrolling status line. Best in OLED.
export default function Led({ m }: IDrawProps) {
  const { accent } = m;
  const ink = m.st === 'idle' ? m.t.ink2 : accent;
  const onD = Math.round(m.frac * ND);
  const marquee = `${m.capText} · ${m.digits} left · until ${m.endShort}`.toUpperCase();
  return (
    <div
      style={{
        position: 'absolute',
        left: 14,
        top: 34,
        width: 332,
        height: 236,
        borderRadius: 16,
        backgroundColor: PANEL,
        backgroundImage: `radial-gradient(circle, ${WHITE(0.07)} 1.2px, transparent 1.6px)`,
        backgroundSize: '7px 7px',
        border: `1px solid ${PANEL_LINE}`,
        overflow: 'hidden',
        boxShadow: `0 16px 36px ${BLACK(0.4)}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 14,
          height: 24,
          overflow: 'hidden',
          borderBottom: `1px solid ${RULE}`,
          WebkitMaskImage: EDGE_MASK,
          maskImage: EDGE_MASK,
        }}
      >
        <div
          className="afx-marq"
          style={{
            display: 'flex',
            width: 'max-content',
            whiteSpace: 'nowrap',
            fontFamily: DOT,
            fontSize: 17,
            letterSpacing: '.12em',
            color: ink,
            opacity: 0.8,
            paddingLeft: 18,
          }}
        >
          <span style={{ paddingRight: 48 }}>{marquee}</span>
          <span style={{ paddingRight: 48 }}>{marquee}</span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 52,
          textAlign: 'center',
          fontFamily: DOT,
          fontSize: m.long ? 64 : 92,
          lineHeight: 1.1,
          color: ink,
          textShadow: `0 0 6px ${alpha(accent, 0x99)}, 0 0 20px ${alpha(accent, 0x40)}`,
        }}
      >
        {m.digits}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 22,
          right: 22,
          bottom: 18,
          display: 'flex',
          gap: 5,
          justifyContent: 'center',
        }}
      >
        {Array.from({ length: ND }, (_, i) => (
          <span
            key={i}
            style={{
              display: 'block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: i < onD ? accent : DOT_OFF,
              boxShadow: i < onD ? `0 0 6px ${alpha(accent, 0x99)}` : undefined,
            }}
          />
        ))}
      </div>
      <div
        className="afx-scan"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 24,
          background: `linear-gradient(180deg, transparent, ${WHITE(0.04)}, transparent)`,
          opacity: m.liveOp,
        }}
      />
    </div>
  );
}
