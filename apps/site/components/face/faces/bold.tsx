import { Fragment, type CSSProperties } from 'react';
import { BLACK, WHITE } from '../art';
import { alpha } from '../geometry';
import { column, EndLine, type IDrawProps, Kicker } from '../kit';

const NS = 30;
const GROUP = 5;
// Every colon stands alone in its case-raised form, so the hour colon matches the blinking one and both sit on the
// figures' optical centre instead of the baseline.
const colon: CSSProperties = { margin: '0 3px', fontFeatureSettings: '"tnum" 1, "case" 1' };

// Heavy display digits for across-the-room reading, with a slim progress rail.
export default function Bold({ m }: IDrawProps) {
  const { t, accent, night } = m;
  const onN = Math.round(m.frac * NS);
  // A tabular figure nets about 0.6 em at this weight and tracking: every length stays inside a 300 px measure.
  const n = m.digits.length;
  const fs = n > 8 ? 62 : n > 7 ? 72 : m.long ? 84 : 108;
  const lit: CSSProperties = {
    background: accent,
    boxShadow: night ? `0 0 7px ${alpha(accent, 0x59)}` : `inset 0 1px 0 ${WHITE(0.3)}`,
  };
  const unlit: CSSProperties = {
    background: t.track,
    boxShadow: night ? `inset 0 1px 0 ${BLACK(0.35)}` : `inset 0 1px 0 ${BLACK(0.05)}`,
  };
  return (
    <div style={column(14)}>
      <Kicker m={m} color={accent} />
      <span
        style={{
          display: 'flex',
          alignItems: 'baseline',
          fontSize: fs,
          fontWeight: 800,
          lineHeight: 0.84,
          letterSpacing: '-0.055em',
          fontVariantNumeric: 'tabular-nums',
          fontOpticalSizing: 'auto',
        }}
      >
        {m.dL.split(':').map((part, i) => (
          <Fragment key={i}>
            {i > 0 && <span style={{ ...colon, color: t.ink2 }}>:</span>}
            <span>{part}</span>
          </Fragment>
        ))}
        {m.dR && (
          <>
            <span className="afx-blink" style={{ ...colon, color: accent }}>
              :
            </span>
            <span>{m.dR}</span>
          </>
        )}
      </span>
      <div style={{ display: 'flex', gap: 9, marginTop: 4 }}>
        {Array.from({ length: NS / GROUP }, (_, g) => (
          <span key={g} style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: GROUP }, (_, j) => {
              const i = g * GROUP + j;
              return (
                <span
                  key={i}
                  className={m.live && i === onN - 1 ? 'afx-breath' : undefined}
                  style={{
                    display: 'block',
                    width: 4,
                    height: 18,
                    borderRadius: 1.5,
                    ...(i < onN ? lit : unlit),
                  }}
                />
              );
            })}
          </span>
        ))}
      </div>
      <EndLine m={m} px={16} style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.005em' }} />
    </div>
  );
}
