import type { CSSProperties } from 'react';
import { BLACK, NAVY, WHITE } from '../art';
import { alpha } from '../geometry';
import { EndLine, type IDrawProps } from '../kit';

const DRUM_SHADOW = {
  light: `0 10px 22px ${NAVY(0.1)}, inset 0 0 0 1px #D6D9E3`,
  night: `0 10px 22px ${BLACK(0.25)}, inset 0 0 0 1px ${WHITE(0.05)}`,
};
// The drums fade into the porcelain ground by day and into shadow at night.
const DRUM_FADE = {
  light: 'linear-gradient(180deg, rgba(244,245,250,.92), transparent 32%, transparent 68%, rgba(244,245,250,.92))',
  night: `linear-gradient(180deg, ${BLACK(0.55)}, transparent 32%, transparent 68%, ${BLACK(0.55)})`,
};

const row = (top: number, current: boolean): CSSProperties => ({
  position: 'absolute',
  left: 0,
  right: 0,
  top,
  textAlign: 'center',
  fontSize: 80,
  lineHeight: '100px',
  fontWeight: current ? 500 : 400,
  opacity: current ? undefined : 0.4,
});

// Odometer drums: the next digit is always just visible; the last drum rolls each second while awake.
export default function Rolling({ m }: IDrawProps) {
  const { t, accent } = m;
  const k = m.night ? 'night' : 'light';
  const mods = m.h > 0 ? [10, 10, 6, 10] : [6, 10, 6, 10];
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 50,
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
        {m.four.map((d, i) => {
          const mod = mods[i] ?? 10;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  position: 'relative',
                  width: 66,
                  height: 156,
                  borderRadius: 12,
                  background: t.card,
                  color: t.cardInk,
                  overflow: 'hidden',
                  boxShadow: DRUM_SHADOW[k],
                }}
              >
                <div
                  className={i === 3 ? 'afx-roll' : undefined}
                  style={{ position: 'absolute', left: 0, top: 0, width: 66, height: 156 }}
                >
                  <span style={row(-72, false)}>{(d + 1) % mod}</span>
                  <span style={row(28, true)}>{d}</span>
                  <span style={row(128, false)}>{(d + mod - 1) % mod}</span>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: DRUM_FADE[k],
                    pointerEvents: 'none',
                  }}
                />
              </div>
              {i === 1 && (
                <span className="afx-blink" style={{ fontSize: 56, fontWeight: 300, color: accent }}>
                  :
                </span>
              )}
            </div>
          );
        })}
        <div
          style={{
            position: 'absolute',
            left: -10,
            right: -10,
            top: 46,
            height: 64,
            borderTop: `1px solid ${alpha(accent, 0x99)}`,
            borderBottom: `1px solid ${alpha(accent, 0x99)}`,
            pointerEvents: 'none',
          }}
        />
      </div>
      <EndLine m={m} px={15} />
    </div>
  );
}
