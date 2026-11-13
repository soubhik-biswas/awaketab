import type { CSSProperties } from 'react';
import { BLACK, NAVY, WHITE } from '../art';
import { alpha, f1, P } from '../geometry';
import { D, digitSize, EndLine, type IDrawProps, Kicker } from '../kit';

const CYAN = '#3FB8FF';
const VIOLET = '#7B5CFF';
const RING_MASK = 'radial-gradient(circle, transparent 0 106px, #000 107px 128px, transparent 128.5px)';
const GLOW_MASK = 'radial-gradient(circle, transparent 0 96px, #000 104px 132px, transparent 140px)';
const GLINT_MASK = 'radial-gradient(circle, transparent 0 120.5px, #000 121.5px 123px, transparent 124px)';
const disc: CSSProperties = { position: 'absolute', left: 50, top: 20, width: 260, height: 260, borderRadius: '50%' };
const masked = (mask: string): CSSProperties => ({ ...disc, WebkitMaskImage: mask, maskImage: mask });
// Darker walls and a clear core, so the band reads as a glass tube with light inside it.
const tube = (wall: string): string =>
  `radial-gradient(circle, ${wall} 106.5px, transparent 113.5px 121px, ${wall} 128.5px)`;
// A reflection on the tube where light from the top left catches it.
const glint = (a: number): string =>
  `conic-gradient(from 225deg, ${WHITE(0)} 0deg, ${WHITE(a)} 90deg, ${WHITE(0)} 180deg)`;
const PEARL = 'radial-gradient(circle at 36% 32%, #FFFFFF 0 34%, #EEF2FA 70%, #D3D9E6 100%)';

// A glowing gradient ring that closes toward 12; a round cap closes its flat start at 12.
export default function Halo({ m }: IDrawProps) {
  const deg = 360 * m.ringFrac;
  const d = deg.toFixed(1);
  const end = m.multi ? VIOLET : m.accent;
  const grad = `conic-gradient(from 0deg, ${
    m.multi
      ? `${m.lamp} 0deg, ${CYAN} ${(deg * 0.6).toFixed(1)}deg, ${VIOLET} ${d}deg`
      : `${m.accent} 0deg, ${m.accent} ${d}deg`
  }, transparent ${d}deg 360deg)`;
  const [x, y] = P(117.5, deg, 130, 130);
  const halted = m.st === 'paused' || m.st === 'blocked' || m.st === 'unsupported';
  const glow = m.multi ? (m.night ? 0.75 : 0.4) : m.night ? 0.32 : 0.18;
  const drop = `0 1.5px 4px ${m.night ? BLACK(0.45) : NAVY(0.18)}`;
  return (
    <>
      <div style={{ ...masked(RING_MASK), background: m.t.track }} />
      <div
        className={`af-tr ${D}`}
        style={{ ...masked(GLOW_MASK), background: grad, filter: 'blur(16px)', opacity: glow }}
      />
      <div className="af-tr" style={{ ...masked(RING_MASK), background: grad }} />
      {deg > 0 && (
        <span
          style={{
            position: 'absolute',
            left: 169.25,
            top: 21.75,
            width: 21.5,
            height: 21.5,
            borderRadius: '50%',
            background: m.multi ? m.lamp : m.accent,
          }}
        />
      )}
      <div className={D} style={{ ...masked(RING_MASK), background: tube(m.night ? BLACK(0.34) : NAVY(0.1)) }} />
      <div className={D} style={{ ...masked(GLINT_MASK), background: glint(m.night ? 0.3 : 0.75) }} />
      <span
        style={{
          position: 'absolute',
          left: `${f1(50 + x - 10.5)}px`,
          top: `${f1(20 + y - 10.5)}px`,
          width: 21,
          height: 21,
          borderRadius: '50%',
          background: m.hollow ? m.t.panel : PEARL,
          boxShadow: m.hollow
            ? `inset 0 0 0 3.5px ${m.accent}, ${drop}`
            : m.multi
              ? `0 0 0 3px ${alpha(end, 0xb3)}, 0 0 14px 2px ${alpha(end, 0x80)}`
              : `0 0 0 3px ${end}, ${drop}`,
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
        <Kicker m={m} color={halted ? m.accent : m.t.ink2} />
        <span
          style={{
            fontSize: digitSize(m, 'sm'),
            fontWeight: 200,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            ...(m.st === 'up' ? { color: m.t.ink2 } : {}),
          }}
        >
          {m.digits}
        </span>
        <EndLine m={m} px={14} />
      </div>
    </>
  );
}
