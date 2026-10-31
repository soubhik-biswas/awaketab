import { WHITE } from '../art';
import { alpha } from '../geometry';
import { big, EndLine, type IDrawProps } from '../kit';

// Time left as a charge level, with a gentle sheen across the cell.
export default function Battery({ m }: IDrawProps) {
  const { t } = m;
  const tone = m.heatT(m.frac);
  const w = Math.max(6, Math.round(232 * m.frac));
  const inside = m.frac > 0.45;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 40,
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            position: 'relative',
            width: 264,
            height: 118,
            borderRadius: 26,
            border: `4px solid ${t.ink}`,
            padding: 8,
            boxSizing: 'border-box',
          }}
        >
          <div
            className="af-tr"
            style={{
              position: 'relative',
              height: 94,
              width: w,
              borderRadius: 16,
              background: `linear-gradient(90deg, ${tone}, ${alpha(tone, 0xd9)})`,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <span
              className="afx-sheen"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 60,
                height: 94,
                background: `linear-gradient(90deg, transparent, ${WHITE(0.35)}, transparent)`,
                opacity: m.liveOp,
              }}
            />
          </div>
          <span
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: inside ? 28 : w + 24,
              display: 'flex',
              alignItems: 'center',
              fontSize: 38,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              color: inside ? 'var(--lamp-foreground)' : t.ink,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {m.pctLabel}
          </span>
        </div>
        <div style={{ width: 12, height: 40, borderRadius: '0 6px 6px 0', background: t.ink }} />
      </div>
      <span style={big(52)}>{m.digits}</span>
      <EndLine m={m} px={15} />
    </div>
  );
}
