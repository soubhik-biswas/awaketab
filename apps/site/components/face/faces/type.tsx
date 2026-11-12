import type { CSSProperties } from 'react';
import { pad } from '../geometry';
import { EndLine, type IDrawProps, L, mono } from '../kit';

// Minutes in huge type, seconds in the lamp colour, a progress hairline.
export default function Type({ m }: IDrawProps) {
  const { t, accent } = m;
  const big = m.h > 0 ? `${m.h}:${pad(m.m)}` : String(m.m);
  // Digits advance about 0.56 em at this tracking and the colon 0.22 em; 226 px leaves room for the seconds column.
  const em = big.replace(':', '').length * 0.56 + (m.h > 0 ? 0.22 : 0);
  const fs = Math.min(m.h > 9 ? 92 : m.h > 0 ? 116 : 196, Math.floor(226 / em));
  const unit = m.indef ? 'AWAKE' : 'LEFT';
  const knob: CSSProperties = {
    position: 'absolute',
    top: -5,
    left: m.fracPct,
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: '50%',
    background: accent,
  };
  return (
    <div
      style={{
        position: 'absolute',
        left: 34,
        top: 30,
        width: 292,
        height: 250,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span
          style={{
            fontSize: fs,
            fontWeight: 700,
            letterSpacing: '-0.07em',
            lineHeight: 0.82,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {big}
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10 }}>
          <span
            style={{
              fontSize: 44,
              fontWeight: 300,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: accent,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {pad(m.s)}
          </span>
          <span className={L} style={mono(12, '.14em', t.ink2)}>
            {m.h > 0 ? `H:MIN ${unit}` : `MIN ${unit}`}
          </span>
        </span>
      </div>
      <div style={{ position: 'relative', marginTop: 22, height: 2, background: t.track }}>
        <div
          className="af-tr"
          style={{ position: 'absolute', left: 0, top: 0, height: 2, width: m.fracPct, background: accent }}
        />
        <span className="af-tr" style={knob} />
        <span className="afx-pulse-d" style={{ ...knob, opacity: m.haloOp }} />
      </div>
      <EndLine m={m} px={15} style={{ marginTop: 14 }} />
    </div>
  );
}
