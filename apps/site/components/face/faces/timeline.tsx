import type { CSSProperties } from 'react';
import { CARD_SHADOW } from '../art';
import '../face-art.css';
import { alpha } from '../geometry';
import { big, type IDrawProps, Kicker, L, mono } from '../kit';

// Now → Ends, like a boarding pass. The most literal way to read time left.
export default function Timeline({ m }: IDrawProps) {
  const { t, accent } = m;
  const tl = m.st === 'idle' ? 0 : 1 - m.frac;
  const x = `${(22 + 280 * tl).toFixed(1)}px`;
  const marker: CSSProperties = {
    position: 'absolute',
    top: 96,
    left: x,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: '50%',
    background: accent,
  };
  const notch = (side: 'left' | 'right'): CSSProperties => ({
    position: 'absolute',
    ...(side === 'left' ? { left: -11 } : { right: -11 }),
    top: 126,
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: t.ground,
  });
  const time: CSSProperties = { fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em' };
  return (
    <div
      style={{
        position: 'absolute',
        left: 18,
        top: 22,
        width: 324,
        height: 266,
        borderRadius: 24,
        background: t.panel,
        boxShadow: CARD_SHADOW[m.theme],
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', left: 22, top: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className={L} style={mono(12, '.14em', t.ink2)}>
          NOW
        </span>
        <span style={time}>{m.nowShort}</span>
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
          ENDS
        </span>
        <span style={{ ...time, color: accent }}>{m.endShort}</span>
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
          top: 98,
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
          top: 98,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: accent,
        }}
      />
      <span className="af-tr" style={{ ...marker, boxShadow: `0 0 0 4px ${alpha(accent, 0x26)}` }} />
      <span className="afx-pulse-d" style={{ ...marker, opacity: m.haloOp }} />
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
      <span style={notch('left')} />
      <span style={notch('right')} />
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
  );
}
