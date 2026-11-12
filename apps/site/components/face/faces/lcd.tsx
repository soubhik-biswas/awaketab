import { BLACK, CARD_SHADOW } from '../art';
import { alpha } from '../geometry';
import { type IDrawProps, L, MONO, mono, PLATE } from '../kit';
import type { TFaceModel } from '../model';

// The bezel stays dark in every theme, like the real object.
const BEZEL = {
  light: 'linear-gradient(180deg, #2A3550, #1C1F29)',
  night: 'linear-gradient(180deg, #1C2438, #0C1120)',
};
const NB = 20;

// The corner tag says AWAKE only while the screen is held and PAUSE only when the person paused; every other state
// reads in the face's own top word (not awake, starting).
const tagWord = (m: TFaceModel): string => {
  if (m.awake) return 'AWAKE';
  if (m.st === 'idle') return 'READY';
  if (m.st === 'up') return 'END';
  if (m.st === 'paused' && !m.needs) return 'PAUSE';
  return m.topWord;
};

// Slanted segments over a faint 88:88 ghost, like a bedside clock.
export default function Lcd({ m }: IDrawProps) {
  const { accent } = m;
  const onB = Math.round(m.frac * NB);
  const glow = `0 0 10px ${alpha(accent, 0x40)}`;
  const ghost = m.digits.length > 7 ? '88:88:88' : m.long ? '8:88:88' : '88:88';
  return (
    <div
      className={PLATE}
      style={{
        position: 'absolute',
        left: 18,
        top: 38,
        width: 324,
        height: 220,
        borderRadius: 26,
        background: m.night ? BEZEL.night : BEZEL.light,
        boxShadow: CARD_SHADOW[m.theme],
        padding: 12,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 300,
          height: 196,
          borderRadius: 16,
          background: `radial-gradient(ellipse at 50% 40%, ${alpha(accent, 0x14)}, transparent 70%), ${m.t.lcdS}`,
          boxShadow: `inset 0 2px 12px ${BLACK(0.35)}`,
          overflow: 'hidden',
        }}
      >
        <span className={L} style={{ position: 'absolute', left: 18, top: 14, ...mono(12, '.16em', accent) }}>
          {m.h > 0 ? 'H · MIN · SEC' : 'MIN · SEC'}
        </span>
        <span
          className={L}
          style={{
            position: 'absolute',
            right: 18,
            top: 12,
            padding: '1px 6px',
            border: `1px solid ${accent}`,
            borderRadius: 4,
            ...mono(12, '.14em', accent),
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {tagWord(m)}
        </span>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 44,
            display: 'flex',
            justifyContent: 'center',
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: m.long ? 56 : 82,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            transform: 'skewX(-7deg)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span style={{ position: 'absolute', color: alpha(accent, 0x26) }}>{ghost}</span>
          <span style={{ position: 'relative', color: accent, textShadow: glow }}>{m.dL}</span>
          {m.dR && (
            <>
              <span className="afx-blink" style={{ position: 'relative', color: accent }}>
                :
              </span>
              <span style={{ position: 'relative', color: accent, textShadow: glow }}>{m.dR}</span>
            </>
          )}
        </div>
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 40, display: 'flex', gap: 3 }}>
          {Array.from({ length: NB }, (_, i) => (
            <span
              key={i}
              style={{
                display: 'block',
                flex: 1,
                height: 8,
                borderRadius: 1,
                background: i < onB ? accent : alpha(accent, 0x22),
              }}
            />
          ))}
        </div>
        <span className={L} style={{ position: 'absolute', left: 18, bottom: 14, ...mono(13, '.1em', accent) }}>
          END {m.endShort}
        </span>
        <span className={L} style={{ position: 'absolute', right: 18, bottom: 14, ...mono(13, '.1em', accent) }}>
          {m.pctLabel}
        </span>
      </div>
    </div>
  );
}
