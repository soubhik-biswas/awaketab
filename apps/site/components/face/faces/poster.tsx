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
  // Hours read below the seconds disc instead of under it, sized to the 288 px between the margins (a digit advances
  // about 0.66 em, the colon 0.31 em) and centred between the disc and the progress line.
  const hours = m.h > 0;
  const fs = hours ? Math.min(120, Math.floor(288 / ((big.length - 1) * 0.66 + 0.31))) : 196;
  const label = {
    fontFamily: DISPLAY,
    fontStretch: '112%',
    fontSize: lmin(14),
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '.04em',
  };
  return (
    <div className={PLATE} style={card(m, { background: a.ground, color: a.ink })}>
      {hours && (
        <span
          className={L}
          style={{ ...label, position: 'absolute', left: 22, top: 50, maxWidth: 200, lineHeight: 1.2, color: m.accent }}
        >
          {m.topWord}
        </span>
      )}
      <span
        style={{
          position: 'absolute',
          left: hours ? 22 : 18,
          top: hours ? Math.round(166 - 0.474 * fs) : 4,
          fontFamily: DISPLAY,
          fontStretch: '112%',
          fontSize: fs,
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
        <span style={{ fontSize: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{pad(m.s)}</span>
        <span className={L} style={{ fontFamily: MONO, fontSize: lmin(12), letterSpacing: '.1em' }}>
          SEC
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
          style={{ ...label, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}
        >
          <span style={{ lineHeight: 1.2, textWrap: 'balance' }}>{m.endLine}</span>
          {!m.indef && <span style={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}>{m.pctLabel}</span>}
        </span>
      </div>
    </div>
  );
}
