import type { CSSProperties } from 'react';
import { BLACK, NAVY, themed, type TThemed, WHITE } from '../art';
import { alpha } from '../geometry';
import { big, type IDrawProps, Kicker, L, mono, PLATE } from '../kit';

const DROP = { light: `0 22px 44px ${NAVY(0.12)}`, dark: `0 28px 60px ${BLACK(0.55)}`, oled: 'none' };
const EDGE = {
  light: 'inset 0 0 0 1px #D4D4E2, inset 0 1px 0 #FFFFFF',
  dark: `inset 0 0 0 1px #262A35, inset 0 1px 0 ${WHITE(0.08)}`,
  oled: 'inset 0 0 0 1px #1A2236',
};
// Heavy card stock lit from the top left; the tear-off stub below the perforation is a shade deeper.
const PAPER: TThemed<string> = {
  light: 'linear-gradient(165deg, #FFFFFF 0%, #FCFCFE 45%, #F2F2F7 100%)',
  dark: `radial-gradient(120% 70% at 12% 0%, ${WHITE(0.06)}, transparent 55%), linear-gradient(165deg, #161920 0%, #0D0F14 100%)`,
  oled: '#000000',
};
const STUB: TThemed<string> = {
  light: `linear-gradient(180deg, ${NAVY(0.035)}, ${NAVY(0.015)})`,
  dark: `linear-gradient(180deg, ${BLACK(0.28)}, ${BLACK(0.12)})`,
  oled: '#05070C',
};
// The ground under the route's open start ring and a resting marker, close to the paper at that height.
const HOLE: TThemed<string> = { light: '#FCFCFE', dark: '#13161D', oled: '#000000' };
const PERF = 136.5;
// The ticket's punched notches are real holes, so the page behind shows through them.
const notch = (side: 'left' | 'right'): string =>
  `radial-gradient(circle at ${side === 'left' ? '0' : '100%'} ${PERF}px, transparent 11px, #000 11.5px)`;
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
// The route runs 280 px from 22 to 302 along y 108.
const RX = 22;
const RW = 280;
const RY = 108;

// Now → Ends, like a boarding pass. The most literal way to read time left.
export default function Timeline({ m }: IDrawProps) {
  const { t, accent, theme } = m;
  const idle = m.st === 'idle';
  // With no end the pass runs from the start to now, and the marker rests on now.
  const open = m.indef && !idle;
  const tl = idle ? 0 : open ? 1 : 1 - m.frac;
  const hole = HOLE[theme];
  const disc: CSSProperties = { position: 'absolute', inset: 0, borderRadius: '50%', background: accent };
  const time: CSSProperties = {
    fontSize: 24,
    fontWeight: 500,
    letterSpacing: '-0.02em',
    lineHeight: 1.15,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  };
  const field: CSSProperties = { position: 'absolute', top: 20, display: 'flex', flexDirection: 'column', gap: 4 };
  const rightWord = m.st === 'up' ? 'ENDED' : open ? 'NOW' : 'ENDS';
  const rightTime = open ? m.nowShort : m.indef ? 'No end' : m.endShort;
  const end: CSSProperties = { position: 'absolute', top: RY - 6, width: 12, height: 12, borderRadius: '50%' };
  return (
    <>
      <div style={{ ...CARD, boxShadow: themed(theme, DROP) }} />
      <div
        className={PLATE}
        style={{
          ...CARD,
          background: PAPER[theme],
          boxShadow: themed(theme, EDGE),
          overflow: 'hidden',
          ...NOTCHED,
        }}
      >
        <div style={{ position: 'absolute', left: 0, right: 0, top: PERF, bottom: 0, background: STUB[theme] }} />
        <div style={{ ...field, left: RX }}>
          <span className={L} style={mono(12, '.14em', t.ink2)}>
            {open ? 'STARTED' : 'NOW'}
          </span>
          <span style={time}>{open ? m.t12(m.nowSec - m.r) : m.nowShort}</span>
        </div>
        <div style={{ ...field, right: RX, alignItems: 'flex-end' }}>
          <span className={L} style={{ ...mono(12, '.14em', t.ink2), marginRight: '-.14em' }}>
            {rightWord}
          </span>
          <span style={{ ...time, color: accent }}>{rightTime}</span>
        </div>
        <div
          style={{
            position: 'absolute',
            left: RX,
            top: RY - 1.5,
            width: RW,
            height: 3,
            backgroundImage: `radial-gradient(circle, ${t.ink2} 0 1px, transparent 1.4px)`,
            backgroundSize: '7px 3px',
            backgroundRepeat: 'repeat-x',
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: RX - 0.5,
            top: RY - 4,
            width: RW,
            height: 8,
            backgroundImage: `linear-gradient(90deg, ${alpha(t.ink2, 0x80)} 0 1px, transparent 0)`,
            backgroundSize: `${RW / 4}px 8px`,
            backgroundRepeat: 'repeat-x',
          }}
        />
        <div
          className="af-tr"
          style={{
            position: 'absolute',
            left: RX,
            top: RY - 1,
            height: 2,
            borderRadius: 1,
            width: `${(RW * tl).toFixed(1)}px`,
            background: `linear-gradient(90deg, ${alpha(accent, 0x26)}, ${accent})`,
          }}
        />
        <span style={{ ...end, left: RX - 6, border: `2px solid ${t.ink2}`, background: hole }} />
        <span style={{ ...end, left: RX + RW - 6, background: accent }} />
        <span
          className="af-tr"
          style={{
            position: 'absolute',
            top: RY - 8,
            left: `${(RX + RW * tl).toFixed(1)}px`,
            width: 16,
            height: 16,
            marginLeft: -8,
          }}
        >
          <span className="afx-pulse-d" style={{ ...disc, opacity: m.haloOp }} />
          <span
            style={{
              ...disc,
              // Paused, blocked or unsupported, the marker is a ring: it holds its place but is not moving.
              background: m.hollow ? hole : accent,
              boxShadow: `inset 0 0 0 ${m.hollow ? 3 : 0}px ${accent}, 0 0 0 4px color-mix(in srgb, ${accent} 15%, ${hole})`,
            }}
          />
        </span>
        <div
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            top: PERF - 1.5,
            height: 3,
            backgroundImage: `radial-gradient(circle, ${t.line} 0 1.2px, transparent 1.6px)`,
            backgroundSize: '8px 3px',
            backgroundRepeat: 'repeat-x',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: PERF,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Kicker m={m} />
          <span style={big(m.long ? 54 : 60, 300, '-0.045em')}>{m.digits}</span>
        </div>
      </div>
    </>
  );
}
