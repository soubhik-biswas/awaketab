import type { CSSProperties } from 'react';
import { BLACK, NAVY, themed, WHITE } from '../art';
import { big, type IDrawProps, Kicker, L, mono, PLATE } from '../kit';

const DROP = { light: `0 22px 44px ${NAVY(0.12)}`, dark: `0 28px 60px ${BLACK(0.55)}`, oled: 'none' };
const EDGE = {
  light: 'inset 0 0 0 1px #D4D4E2, inset 0 1px 0 #FFFFFF',
  dark: `inset 0 0 0 1px #262A35, inset 0 1px 0 ${WHITE(0.08)}`,
  oled: 'inset 0 0 0 1px #1A2236',
};
// The ticket's punched notches are real holes, so the page behind shows through them.
const notch = (side: 'left' | 'right'): string =>
  `radial-gradient(circle at ${side === 'left' ? '0' : '100%'} 136.5px, transparent 11px, #000 11.5px)`;
const NOTCHED: CSSProperties = {
  WebkitMaskImage: `${notch('left')}, ${notch('right')}`,
  maskImage: `${notch('left')}, ${notch('right')}`,
  WebkitMaskSize: '50% 100%',
  maskSize: '50% 100%',
  WebkitMaskPosition: 'left top, right top',
  maskPosition: 'left top, right top',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};
const CARD: CSSProperties = { position: 'absolute', left: 18, top: 22, width: 324, height: 266, borderRadius: 24 };

// Now → Ends, like a boarding pass. The most literal way to read time left.
export default function Timeline({ m }: IDrawProps) {
  const { t, accent } = m;
  const idle = m.st === 'idle';
  // With no end the pass runs from the start to now, and the marker rests on now.
  const open = m.indef && !idle;
  const tl = idle ? 0 : open ? 1 : 1 - m.frac;
  const disc: CSSProperties = { position: 'absolute', inset: 0, borderRadius: '50%', background: accent };
  const time: CSSProperties = { fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', whiteSpace: 'nowrap' };
  const rightWord = m.st === 'up' ? 'ENDED' : open ? 'NOW' : 'ENDS';
  const rightTime = open ? m.nowShort : m.indef ? 'No end' : m.endShort;
  return (
    <>
      <div style={{ ...CARD, boxShadow: themed(m.theme, DROP) }} />
      <div
        className={PLATE}
        style={{ ...CARD, background: t.panel, boxShadow: themed(m.theme, EDGE), overflow: 'hidden', ...NOTCHED }}
      >
        <div style={{ position: 'absolute', left: 22, top: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className={L} style={mono(12, '.14em', t.ink2)}>
            {open ? 'STARTED' : 'NOW'}
          </span>
          <span style={time}>{open ? m.t12(m.nowSec - m.r) : m.nowShort}</span>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 22,
            top: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 2,
          }}
        >
          <span className={L} style={mono(12, '.14em', t.ink2)}>
            {rightWord}
          </span>
          <span style={{ ...time, color: accent }}>{rightTime}</span>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 22,
            right: 22,
            top: 104,
            height: 2,
            backgroundImage: `linear-gradient(90deg, ${t.ink2} 50%, transparent 50%)`,
            backgroundSize: '8px 2px',
            opacity: 0.5,
          }}
        />
        <div
          className="af-tr"
          style={{
            position: 'absolute',
            left: 22,
            top: 103,
            height: 4,
            borderRadius: 2,
            width: `${(280 * tl).toFixed(1)}px`,
            background: t.ink2,
            opacity: 0.55,
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: 16,
            top: 99,
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: `2px solid ${t.ink2}`,
            background: t.panel,
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: 16,
            top: 99,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: accent,
          }}
        />
        <span
          className="af-tr"
          style={{
            position: 'absolute',
            top: 97,
            left: `${(22 + 280 * tl).toFixed(1)}px`,
            width: 16,
            height: 16,
            marginLeft: -8,
          }}
        >
          <span style={{ ...disc, boxShadow: `0 0 0 4px color-mix(in srgb, ${accent} 15%, ${t.panel})` }} />
          <span className="afx-pulse-d" style={{ ...disc, opacity: m.haloOp }} />
        </span>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 136,
            height: 1,
            backgroundImage: `linear-gradient(90deg, ${t.line} 50%, transparent 50%)`,
            backgroundSize: '10px 1px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 156,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={big(60)}>{m.digits}</span>
          <Kicker m={m} />
        </div>
      </div>
    </>
  );
}
