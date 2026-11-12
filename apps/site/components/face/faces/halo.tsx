import type { CSSProperties } from 'react';
import { alpha, f1, P } from '../geometry';
import { digitSize, type IDrawProps, L, lmin, MONO } from '../kit';

const CYAN = '#3FB8FF';
const VIOLET = '#7B5CFF';
const RING_MASK = 'radial-gradient(circle, transparent 0 106px, #000 107px 128px, transparent 128.5px)';
const GLOW_MASK = 'radial-gradient(circle, transparent 0 96px, #000 104px 132px, transparent 140px)';
const disc: CSSProperties = { position: 'absolute', left: 50, top: 20, width: 260, height: 260, borderRadius: '50%' };
const masked = (mask: string): CSSProperties => ({ ...disc, WebkitMaskImage: mask, maskImage: mask });

// A glowing gradient ring that closes toward 12; a round cap closes its flat start at 12.
export default function Halo({ m }: IDrawProps) {
  const deg = 360 * m.ringFrac;
  const d = deg.toFixed(1);
  const grad = `conic-gradient(from 0deg, ${
    m.multi
      ? `${m.lamp} 0deg, ${CYAN} ${(deg * 0.6).toFixed(1)}deg, ${VIOLET} ${d}deg`
      : `${m.accent} 0deg, ${m.accent} ${d}deg`
  }, transparent ${d}deg 360deg)`;
  const [x, y] = P(117, deg, 130, 130);
  return (
    <>
      <div style={{ ...masked(RING_MASK), background: m.t.track }} />
      <div
        className="af-tr"
        style={{ ...masked(GLOW_MASK), background: grad, filter: 'blur(16px)', opacity: m.multi ? 0.75 : 0.35 }}
      />
      <div className="af-tr" style={{ ...masked(RING_MASK), background: grad }} />
      {deg > 0 && (
        <span
          style={{
            position: 'absolute',
            left: 169.25,
            top: 21.85,
            width: 21.5,
            height: 21.5,
            borderRadius: '50%',
            background: m.multi ? m.lamp : m.accent,
          }}
        />
      )}
      <span
        style={{
          position: 'absolute',
          left: `${f1(50 + x - 11)}px`,
          top: `${f1(20 + y - 11)}px`,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: `0 0 0 4px ${alpha(m.accent, 0x99)}, 0 0 20px ${m.accent}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 360,
          height: 300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <span
          className={L}
          style={{
            fontFamily: MONO,
            fontSize: lmin(12),
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: m.t.ink2,
          }}
        >
          {m.topWord}
        </span>
        <span
          style={{
            fontSize: digitSize(m, 'sm'),
            fontWeight: 200,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontSize: lmin(14), color: m.t.ink2 }}>
          {m.endLine}
        </span>
      </div>
    </>
  );
}
