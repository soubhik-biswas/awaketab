import '../face-art.css';
import { column, EndLine, type IDrawProps, Kicker } from '../kit';

const NS = 30;

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
          fontSize: m.long ? 92 : 132,
          lineHeight: 0.86,
          letterSpacing: '-0.06em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span>{m.dL}</span>
        {m.dR && (
          <>
            <span className="afx-blink" style={{ color: accent, margin: '0 2px' }}>
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
