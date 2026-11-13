import type { CSSProperties } from 'react';
import { alpha } from '../geometry';
import { big, type IDrawProps, Kicker, L, mono } from '../kit';

const NBR = 30;
const BW = 6;
const GAP = 3;
const ROW = NBR * BW + (NBR - 1) * GAP;
const X0 = (360 - ROW) / 2;
// The bars stand on a time axis at 232; the bar for now is the tallest, so it reads first.
const BASE = 232;
const NOW_H = 100;
const HEIGHTS = Array.from({ length: NBR }, (_, i) => 30 + Math.round(56 * (0.5 + 0.5 * Math.sin(i * 0.55))));

// The whole session as bars on a time axis: spent ones fade, the current one breathes.
export default function Bars({ m }: IDrawProps) {
  const { t, accent } = m;
  const idle = m.st === 'idle';
  const up = m.st === 'up';
  // With no end every bar is awake and the newest, on the right, is now.
  const nowBar = m.indef ? NBR - 1 : Math.min(NBR - 1, Math.floor((1 - m.frac) * NBR));
  const from = m.indef && !idle ? m.t12(m.nowSec - m.r) : m.startShort;
  const to = m.indef ? (idle ? 'no end' : 'now') : m.endShort;
  const hc = m.heat(m.frac);
  const gone = alpha(t.ink2, 0x38);
  const lit = `linear-gradient(180deg, ${hc}, ${alpha(hc, 0xa6)})`;
  const bar = (i: number, hgt: number): CSSProperties => {
    const spent = up || (!idle && !m.indef && i < nowBar);
    const cur = !idle && !up && i === nowBar;
    const base: CSSProperties = { display: 'block', width: BW, borderRadius: BW / 2, flex: 'none' };
    if (spent) return { ...base, height: hgt, background: gone };
    if (!cur)
      return {
        ...base,
        height: hgt,
        background: lit,
        opacity: Math.min(1, 0.4 + (0.6 * (NBR - i)) / Math.max(1, NBR - nowBar)),
      };
    // Paused, blocked or unsupported, the bar for now is an outline: it holds the place but is not awake.
    if (m.hollow) return { ...base, height: NOW_H, boxShadow: `inset 0 0 0 1.5px ${accent}` };
    return { ...base, height: NOW_H, background: lit, boxShadow: m.awake ? `0 0 10px ${alpha(hc, 0x59)}` : 'none' };
  };
  return (
    <>
      <div style={{ position: 'absolute', left: 0, top: 36, width: 360, textAlign: 'center' }}>
        <Kicker m={m} />
      </div>
      <div style={{ position: 'absolute', left: 0, top: 62, width: 360, textAlign: 'center' }}>
        <span style={big(58, 300, '-0.045em')}>{m.digits}</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: X0,
          top: BASE - NOW_H,
          width: ROW,
          height: NOW_H,
          display: 'flex',
          alignItems: 'flex-end',
          gap: GAP,
        }}
      >
        {HEIGHTS.map((hgt, i) => (
          <span key={i} className={i === nowBar && m.live ? 'afx-breath' : undefined} style={bar(i, hgt)} />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: X0,
          top: BASE + 4,
          width: ROW,
          height: 6,
          backgroundImage: `linear-gradient(90deg, ${t.ink2} 0 1px, transparent 0), linear-gradient(${t.line}, ${t.line})`,
          backgroundSize: `${(ROW - 1) / 4}px 6px, 100% 1px`,
          backgroundRepeat: 'repeat-x, no-repeat',
          opacity: 0.9,
        }}
      />
      <div
        className={L}
        style={{
          position: 'absolute',
          left: X0,
          top: BASE + 14,
          width: ROW,
          display: 'flex',
          justifyContent: 'space-between',
          lineHeight: 1,
          ...mono(12, '.06em', t.ink2),
        }}
      >
        <span>{from}</span>
        <span>{to}</span>
      </div>
    </>
  );
}
