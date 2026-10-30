import '../face-art.css';
import { big, type IDrawProps, L, mono } from '../kit';

const NBR = 30;
const HEIGHTS = Array.from({ length: NBR }, (_, i) => 40 + Math.round(70 * (0.5 + 0.5 * Math.sin(i * 0.55))));

// The whole session as bars: spent ones fade, the current one breathes.
export default function Bars({ m }: IDrawProps) {
  const { t } = m;
  const nowBar = Math.min(NBR - 1, Math.floor((1 - m.frac) * NBR));
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 34,
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <span style={big(58)}>{m.digits}</span>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 110 }}>
        {HEIGHTS.map((hgt, i) => {
          const spent = m.st !== 'idle' && i < nowBar;
          const cur = m.st !== 'idle' && m.st !== 'up' && i === nowBar;
          return (
            <span
              key={i}
              className={cur && m.live ? 'afx-breath' : undefined}
              style={{
                display: 'block',
                width: 6,
                height: cur ? 110 : hgt,
                borderRadius: 3,
                background: m.st === 'up' || spent ? t.track : m.heat(m.frac),
                opacity: spent || cur ? 1 : 0.45 + (0.55 * (NBR - i)) / Math.max(1, NBR - nowBar),
              }}
            />
          );
        })}
      </div>
      <div
        className={L}
        style={{ width: 267, display: 'flex', justifyContent: 'space-between', ...mono(12, '.06em', t.ink2) }}
      >
        <span>{m.startShort}</span>
        <span>{m.endShort}</span>
      </div>
    </div>
  );
}
