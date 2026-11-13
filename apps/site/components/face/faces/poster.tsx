import type { CSSProperties } from 'react';
import { pad } from '../geometry';
import { card, D, DISPLAY, type IDrawProps, L, lmin, MONO, PLATE } from '../kit';
import type { TFaceTheme } from '../model';

const INK = { light: '#0B1020', night: '#F4F5FA' };
const ON_ACCENT = { light: '#FFFFFF', night: '#05070C' };
const TRACK = { light: 'rgba(11,16,32,.15)', night: 'rgba(255,255,255,.15)' };
// Uncoated stock lit from the top left by day, a deep press black at night and true black in OLED.
const GROUND: Readonly<Record<TFaceTheme, string>> = {
  light:
    'radial-gradient(130% 95% at 0% 0%, #FCFAF5 0%, transparent 58%), linear-gradient(160deg, #F4F1EA 0%, #ECE8DE 100%)',
  dark: 'radial-gradient(130% 95% at 0% 0%, rgba(255,255,255,.05) 0%, transparent 58%), linear-gradient(160deg, #0E1220 0%, #090B14 100%)',
  oled: '#000000',
};
// The poster grid on the 332 × 282 card: 22 px margins, the seconds disc in the top-right corner and every numeral
// standing on one baseline.
const M = 22;
const BASE = 220;
const DISC = 72;
// Archivo's baseline sits 0.834 em into a line box of 1; its figures stand 0.72 em tall, clear of the disc.
const ASC = 0.834;

// Giant minutes in Archivo Expanded on a Swiss poster grid, the seconds printed in a disc.
export default function Poster({ m }: IDrawProps) {
  const ink = m.night ? INK.night : INK.light;
  const open = m.indef && m.st === 'idle';
  const hours = m.h > 0 && !open;
  const big = open ? '∞' : hours ? `${m.h}:${pad(m.m)}` : String(m.m);
  // Minutes stop short of the disc; hours fill the 286 px measure (a digit advances 0.66 em, the colon 0.31 em).
  const fs = hours ? Math.min(150, Math.floor(286 / ((big.length - 1) * 0.66 + 0.31))) : 176;
  const lp = Math.max(14, m.LMIN);
  const caps: CSSProperties = {
    fontFamily: DISPLAY,
    fontStretch: '112%',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    lineHeight: 1.2,
  };
  const foot: CSSProperties = {
    fontFamily: DISPLAY,
    fontSize: lmin(13),
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '.005em',
    fontVariantNumeric: 'tabular-nums',
  };
  return (
    <div className={PLATE} style={card(m, { background: GROUND[m.theme], color: ink })}>
      <span
        className={D}
        style={{ position: 'absolute', left: M, top: M, width: 332 - M * 3 - DISC, height: 2, background: ink }}
      />
      <span
        className={L}
        style={{ ...caps, position: 'absolute', left: M, top: 32, maxWidth: 196, fontSize: lmin(14), color: m.accent }}
      >
        {m.topWord}
      </span>
      <span
        style={{
          position: 'absolute',
          left: M - Math.round(fs * 0.035),
          top: Math.round(BASE - ASC * fs),
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
      {!hours && !open && (
        <span
          className={L}
          style={{
            ...caps,
            position: 'absolute',
            right: M,
            top: Math.round(BASE - ASC * lp),
            fontSize: lmin(14),
            lineHeight: 1,
          }}
        >
          MIN
        </span>
      )}
      <div
        style={{
          position: 'absolute',
          right: M,
          top: M,
          width: DISC,
          height: DISC,
          borderRadius: '50%',
          background: m.accent,
          color: m.night ? ON_ACCENT.night : ON_ACCENT.light,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          lineHeight: 1,
        }}
      >
        <span
          className={m.live ? `${D} afx-breath` : D}
          style={{
            position: 'absolute',
            inset: 4,
            borderRadius: '50%',
            boxShadow: `inset 0 0 0 1px ${m.night ? 'rgba(5,7,12,.28)' : 'rgba(255,255,255,.4)'}`,
          }}
        />
        <span
          style={{
            fontFamily: DISPLAY,
            fontStretch: '112%',
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {pad(m.s)}
        </span>
        <span className={L} style={{ fontFamily: MONO, fontSize: lmin(12), letterSpacing: '.12em' }}>
          SEC
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: M,
          right: M,
          bottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ height: 2, background: m.night ? TRACK.night : TRACK.light }}>
          <div className="af-tr" style={{ height: 2, width: m.fracPct, background: m.accent }} />
        </div>
        <span
          className={L}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}
        >
          <span style={{ ...foot, textWrap: 'balance' }}>{m.endLine}</span>
          {!m.indef && <span style={{ ...foot, whiteSpace: 'nowrap' }}>{m.pctLabel}</span>}
        </span>
      </div>
    </div>
  );
}
