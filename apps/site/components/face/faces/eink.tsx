import type { CSSProperties } from 'react';
import { CARD_SHADOW } from '../art';
import { SERIF } from '../fonts';
import { card, digitSize, type IDrawProps, L, lmin, MONO } from '../kit';
import type { TFaceModel } from '../model';

const PAPER = '#E8E6DF';
const BEZEL = '#D9D6CD';
const INK = '#1E1E1C';

const line = (m: TFaceModel): string =>
  m.st === 'up'
    ? 'finished — the screen may sleep'
    : m.st === 'idle'
      ? `ready when you are · ${m.endLine}`
      : `left · ${m.endLine}`;

// A paper display with serif digits and a faint ghost, calm by daylight.
export default function Eink({ m }: IDrawProps) {
  const digits: CSSProperties = {
    position: 'absolute',
    left: 0,
    width: 332,
    top: 74,
    textAlign: 'center',
    fontFamily: SERIF,
    fontSize: digitSize(m, 'big'),
    fontWeight: 300,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  };
  return (
    <div
      style={card(m, {
        borderRadius: 26,
        backgroundColor: PAPER,
        backgroundImage: 'radial-gradient(rgba(0,0,0,.035) 1px, transparent 1.2px)',
        backgroundSize: '4px 4px',
        boxShadow: `${CARD_SHADOW[m.theme]}, inset 0 0 0 10px ${BEZEL}`,
        color: INK,
      })}
    >
      <div
        className={L}
        style={{
          position: 'absolute',
          left: 26,
          right: 26,
          top: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 8,
          borderBottom: `1.5px solid ${INK}`,
          fontFamily: MONO,
          fontSize: lmin(12),
        }}
      >
        <span>AwakeTab</span>
        <span>{m.nowShort}</span>
      </div>
      <span style={{ ...digits, opacity: 0.06, transform: 'translate(3px, 2px)' }}>{m.digits}</span>
      <span style={digits}>{m.digits}</span>
      <span
        className={L}
        style={{
          position: 'absolute',
          left: 0,
          width: 332,
          top: 176,
          textAlign: 'center',
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontSize: lmin(15),
        }}
      >
        {line(m)}
      </span>
      <div
        className={L}
        style={{
          position: 'absolute',
          left: 26,
          right: 26,
          bottom: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: MONO,
          fontSize: lmin(12),
        }}
      >
        <div style={{ flex: 1, height: 8, border: `1.5px solid ${INK}`, borderRadius: 2, padding: 1 }}>
          <div style={{ height: '100%', width: m.fracPct, background: INK }} />
        </div>
        <span>{m.pctLabel}</span>
      </div>
    </div>
  );
}
