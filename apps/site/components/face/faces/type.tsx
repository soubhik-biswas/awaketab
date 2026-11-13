import type { CSSProperties } from 'react';
import { pad } from '../geometry';
import { D, EndLine, type IDrawProps, Kicker, L, mono } from '../kit';

const W = 292;
const GAP = 16;
const SEC = 44;
// Inter's figure and cap height, and where its baseline falls in a line box of the given height, in em.
const CAP = 0.7275;
const base = (lh: number): number => (lh - 1.2109) / 2 + 0.96875;
const QUARTERS = ['25%', '50%', '75%'] as const;

// Minutes in huge type, seconds in the lamp colour, a progress hairline.
export default function Type({ m }: IDrawProps) {
  const { t, accent } = m;
  const open = m.indef && m.st === 'idle';
  const big = open ? '∞' : m.h > 0 ? `${m.h}:${pad(m.m)}` : String(m.m);
  const unit = open ? 'NO END' : m.h > 0 ? 'H:MIN' : 'MIN';
  const lp = Math.max(12, m.LMIN);
  // The seconds column is as wide as two light 44 px figures or its mono unit (about 0.74 em a character at .14em).
  const side = Math.max(52, Math.ceil(unit.length * 0.74 * lp));
  // Bold figures advance about 0.56 em at this tracking and the colon 0.22 em.
  const em = open ? 0.9 : big.replace(':', '').length * 0.56 + (m.h > 0 ? 0.22 : 0);
  const cap = open || m.h === 0 ? 188 : m.h > 9 ? 92 : 116;
  const fs = Math.min(cap, Math.floor((W - GAP - side) / em));
  const box = fs * 0.82;
  // The seconds' cap line meets the minutes' cap line, and the unit sits on the minutes' baseline.
  const secTop = Math.max(0, fs * (base(0.82) - CAP) - SEC * (base(1) - CAP));
  const unitBottom = Math.max(0, fs * (0.82 - base(0.82)) - lp * 0.2);
  const knob: CSSProperties = {
    position: 'absolute',
    top: -4,
    left: m.fracPct,
    width: 10,
    height: 10,
    marginLeft: -5,
    borderRadius: '50%',
    background: accent,
  };
  return (
    <div
      style={{
        position: 'absolute',
        left: 34,
        top: 30,
        width: W,
        height: 250,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Kicker m={m} color={accent} style={{ lineHeight: 1, whiteSpace: 'nowrap' }} />
        <span className={D} style={{ flex: 1, height: 1, background: t.line }} />
        {!m.indef && (
          <span
            className={L}
            style={{ ...mono(12, '.08em', t.ink2), lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
          >
            {m.pctLabel}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: GAP, marginTop: 16 }}>
        <span
          style={{
            fontSize: fs,
            fontWeight: 700,
            letterSpacing: '-0.07em',
            lineHeight: 0.82,
            fontVariantNumeric: 'tabular-nums',
            fontOpticalSizing: 'auto',
            fontFeatureSettings: '"tnum" 1, "case" 1',
            whiteSpace: 'nowrap',
          }}
        >
          {big}
        </span>
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: box,
            paddingTop: secTop,
            paddingBottom: unitBottom,
          }}
        >
          <span
            style={{
              fontSize: SEC,
              fontWeight: 300,
              letterSpacing: '-0.035em',
              lineHeight: 1,
              color: accent,
              fontVariantNumeric: 'tabular-nums',
              visibility: open ? 'hidden' : undefined,
            }}
          >
            {pad(m.s)}
          </span>
          <span className={L} style={{ ...mono(12, '.14em', t.ink2), lineHeight: 1 }}>
            {unit}
          </span>
        </span>
      </div>
      <div style={{ position: 'relative', marginTop: 18, height: 2, background: t.track }}>
        {QUARTERS.map((q) => (
          <span
            key={q}
            className={D}
            style={{ position: 'absolute', left: q, bottom: 2, width: 1, height: 5, background: t.line }}
          />
        ))}
        <div
          className="af-tr"
          style={{ position: 'absolute', left: 0, top: 0, height: 2, width: m.fracPct, background: accent }}
        />
        <span className="af-tr" style={knob} />
        <span className="afx-pulse-d" style={{ ...knob, opacity: m.haloOp }} />
      </div>
      <EndLine m={m} px={15} style={{ marginTop: 12, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }} />
    </div>
  );
}
