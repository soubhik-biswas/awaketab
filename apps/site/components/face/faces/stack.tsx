import { pad } from '../geometry';
import { type IDrawProps, L, lmin, MONO } from '../kit';

// Minutes over seconds in a tight editorial stack, end time underneath.
export default function Stack({ m }: IDrawProps) {
  const { t, accent } = m;
  const line = (weight: number, color?: string) => ({
    fontSize: m.h > 9 ? 116 : 150,
    fontWeight: weight,
    letterSpacing: '-0.08em',
    lineHeight: 0.8,
    color,
    fontVariantNumeric: 'tabular-nums' as const,
  });
  const unit = (top: number) => ({
    position: 'absolute' as const,
    left: 299,
    top,
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap' as const,
    fontFamily: MONO,
    fontSize: lmin(12),
    color: t.ink2,
  });
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 70,
          top: 14,
          width: 220,
          height: 290,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <span style={line(800)}>{m.h > 0 ? `${m.h}h` : pad(m.m)}</span>
        <span style={line(200, accent)}>{m.h > 0 ? pad(m.m) : pad(m.s)}</span>
        <span className={L} style={{ marginTop: 14, fontSize: lmin(14), color: t.ink2 }}>
          {m.endLine}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 296,
          top: 40,
          width: 6,
          height: 230,
          borderRadius: 3,
          background: t.track,
          overflow: 'hidden',
        }}
      >
        <div
          className="af-tr"
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: 6,
            height: m.fracPct,
            borderRadius: 3,
            background: accent,
          }}
        />
      </div>
      <span className={L} style={unit(18)}>
        {m.h > 0 ? 'HR' : 'MIN'}
      </span>
      <span className={L} style={unit(276)}>
        {m.h > 0 ? 'MIN' : 'SEC'}
      </span>
    </>
  );
}
