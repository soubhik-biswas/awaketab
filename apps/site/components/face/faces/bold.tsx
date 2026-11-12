import { Fragment, type CSSProperties } from 'react';
import { column, EndLine, type IDrawProps, Kicker } from '../kit';

const NS = 30;
// Every colon stands alone, so the hour colon is drawn the same as the blinking one instead of the font's in-number form.
const colon: CSSProperties = { margin: '0 2px' };

// Heavy display digits for across-the-room reading, with a slim progress rail.
export default function Bold({ m }: IDrawProps) {
  const { t, accent } = m;
  const onN = Math.round(m.frac * NS);
  return (
    <div style={column(16)}>
      <Kicker m={m} color={accent} />
      <span
        style={{
          display: 'flex',
          alignItems: 'baseline',
          fontWeight: 800,
          // A hundred hours or more (sessions run up to a week) steps down again so the reading stays inside the face.
          fontSize: m.digits.length > 8 ? 64 : m.long ? 76 : 100,
          lineHeight: 0.86,
          letterSpacing: '-0.06em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {m.dL.split(':').map((part, i) => (
          <Fragment key={i}>
            {i > 0 && <span style={colon}>:</span>}
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
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: NS }, (_, i) => (
          <span
            key={i}
            className={m.live && i === onN - 1 ? 'afx-breath' : undefined}
            style={{
              display: 'block',
              width: 5,
              height: 16,
              borderRadius: 2,
              background: i < onN ? accent : t.track,
            }}
          />
        ))}
      </div>
      <EndLine m={m} px={16} />
    </div>
  );
}
