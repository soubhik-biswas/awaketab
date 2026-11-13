import type { CSSProperties } from 'react';
import { BLACK, NAVY } from '../art';
import { pad } from '../geometry';
import { D, type IDrawProps, Kicker, L, lmin, MONO, Svg } from '../kit';

// The gauge rail right of the stack: 6 × 230 from y 40, with a scale of twelfths and heavier quarters.
const RX = 296;
const RW = 6;
const RT = 40;
const RH = 230;
const SCALE = Array.from({ length: 13 }, (_, i) => {
  const y = (RT + (RH * i) / 12).toFixed(1);
  return `M${RX + 12} ${y}H${RX + (i % 3 === 0 ? 19 : 16)}`;
}).join('');
// Inter's line box is 1.21 em, its baseline 0.969 em down and its capitals 0.727 em tall.
const ASC = 0.969;
const CAP = 0.727;
const BOX = 1.21;
const r1 = (n: number): number => Math.round(n * 10) / 10;

// Minutes over seconds in a tight editorial stack, the state word as a running head and the end time underneath.
export default function Stack({ m }: IDrawProps) {
  const { t, accent } = m;
  // Heavy digits advance about 0.58 em and the h 0.54 em; the column is 220 px wide before the rail.
  const em = m.h > 0 ? String(m.h).length * 0.58 + 0.54 : 1.16;
  const fs = Math.min(m.h > 9 ? 116 : 150, Math.floor(220 / em));
  const lh = fs * 0.8;
  // The column below is centred on y 159: two digit lines, the 14 + 2 + 8 px rule and the end line.
  const endH = 1.25 * Math.max(14, m.LMIN);
  const top = 159 - (2 * lh + 24 + endH) / 2;
  const lead = (lh - BOX * fs) / 2;
  const capTop = top + lead + (ASC - CAP) * fs;
  const baseline = top + lh + lead + ASC * fs;
  const level = RT + RH * (1 - m.frac);
  const line = (weight: number, color?: string): CSSProperties => ({
    fontSize: fs,
    fontWeight: weight,
    letterSpacing: '-0.08em',
    lineHeight: 0.8,
    color,
    fontVariantNumeric: 'tabular-nums',
  });
  const unit = (y: number): CSSProperties => ({
    position: 'absolute',
    left: RX + RW / 2,
    top: y,
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
    fontFamily: MONO,
    fontSize: lmin(12),
    color: t.ink2,
  });
  return (
    <>
      <Kicker
        m={m}
        color={accent}
        style={{
          position: 'absolute',
          left: 38,
          top: r1(capTop),
          height: r1(baseline - capTop),
          display: 'block',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          writingMode: 'vertical-rl',
          // Turned to read upwards from the seconds' baseline, like a book spine.
          transform: 'rotate(180deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 70,
          top: 14,
          width: 220,
          height: 290,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <span style={line(800)}>{m.h > 0 ? `${m.h}h` : pad(m.m)}</span>
        <span style={line(200, accent)}>{m.h > 0 ? pad(m.m) : pad(m.s)}</span>
        <span style={{ display: 'block', width: 28, height: 2, marginTop: 14, background: accent }} />
        <span
          className={L}
          style={{ marginTop: 8, fontSize: lmin(14), lineHeight: 1.25, color: t.ink2, textWrap: 'balance' }}
        >
          {m.endLine}
        </span>
      </div>
      <Svg>
        <path className={D} d={SCALE} fill="none" stroke={t.ink2} strokeOpacity=".55" strokeWidth="1" />
      </Svg>
      <div
        style={{
          position: 'absolute',
          left: RX,
          top: RT,
          width: RW,
          height: RH,
          borderRadius: RW / 2,
          background: t.track,
          boxShadow: `inset 0 1px 2px ${m.night ? BLACK(0.5) : NAVY(0.14)}`,
          overflow: 'hidden',
        }}
      >
        <div
          className="af-tr"
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: RW,
            height: m.fracPct,
            borderRadius: RW / 2,
            background: accent,
          }}
        />
      </div>
      <span
        className="af-tr"
        style={{
          position: 'absolute',
          left: RX - 4,
          top: r1(level - 1),
          width: RW + 8,
          height: 2,
          borderRadius: 1,
          background: accent,
        }}
      />
      <span className={L} style={unit(18)}>
        {m.h > 0 ? 'HR' : 'MIN'}
      </span>
      <span className={L} style={unit(276)}>
        {m.h > 0 ? 'MIN' : 'SEC'}
      </span>
    </>
  );
}
