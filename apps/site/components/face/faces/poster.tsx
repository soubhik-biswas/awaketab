import { pad } from '../geometry';
import { card, DISPLAY, type IDrawProps, L, lmin, MONO, PLATE } from '../kit';

const ART = {
  light: { ground: '#F2EFE8', ink: '#0B1020', onAccent: '#FFFFFF', track: 'rgba(11,16,32,.15)' },
  night: { ground: '#0B0E19', ink: '#F4F5FA', onAccent: '#05070C', track: 'rgba(255,255,255,.15)' },
};

// Giant cropped minutes in Archivo Expanded, editorial and bold.
export default function Poster({ m }: IDrawProps) {
  const a = m.night ? ART.night : ART.light;
  const big = m.h > 0 ? `${m.h}:${pad(m.m)}` : String(m.m);
  return (
    <div className={PLATE} style={card(m, { background: a.ground, color: a.ink })}>
      <span
        style={{
          position: 'absolute',
          left: 18,
          top: 4,
          fontFamily: DISPLAY,
          fontStretch: '112%',
          fontSize: big.length > 4 ? 98 : big.length > 3 ? 120 : 196,
          fontWeight: 900,
          letterSpacing: '-0.06em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {big}
      </span>
      <div
        style={{
          position: 'absolute',
          right: 22,
          top: 22,
          width: 76,
          height: 76,
          borderRadius: '50%',
          background: m.accent,
          color: a.onAccent,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {m.h > 0 ? pad(m.m) : pad(m.s)}
        </span>
        <span className={L} style={{ fontFamily: MONO, fontSize: lmin(12), letterSpacing: '.1em' }}>
          {m.h > 0 ? 'MIN' : 'SEC'}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 22,
          right: 22,
          bottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ height: 2, background: a.track }}>
          <div className="af-tr" style={{ height: 2, width: m.fracPct, background: m.accent }} />
        </div>
        <span
          className={L}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: DISPLAY,
            fontStretch: '112%',
            fontSize: lmin(14),
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.04em',
          }}
        >
          <span>{m.endLine}</span>
          <span>{m.pctLabel}</span>
        </span>
      </div>
    </div>
  );
}
