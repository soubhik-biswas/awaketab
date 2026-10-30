import { CARD_SHADOW } from '../art';
import { alpha } from '../geometry';
import { big, EndLine, type IDrawProps, Kicker, L, lmin, MONO } from '../kit';

const PX = 14;
const GROUND = {
  light: 'linear-gradient(180deg, #FFFFFF, #F1EEE7)',
  dark: 'linear-gradient(180deg, #131B30, #0A0F1C)',
  oled: '#05070C',
};
const SPENT = { light: 'rgba(246,244,239,.62)', night: 'rgba(7,11,22,.62)' };
const EDGE_MASK = 'linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)';

// A minute ruler glides under a fixed needle; the heat strip shows the final stretch.
export default function Tape({ m }: IDrawProps) {
  const { t, fill } = m;
  const tm = Math.max(5, Math.min(180, Math.ceil(m.total / 60)));
  const tw = tm * PX;
  const tp = (min: number) => `${Math.min(100, (100 * min * PX) / tw).toFixed(1)}%`;
  const heat = m.multi
    ? `linear-gradient(90deg, ${fill.ember} 0%, ${fill.amber} ${tp(5)}, ${fill.lime} ${tp(15)}, ${m.lamp} ${tp(30)}, ${m.lamp} 100%)`
    : m.accent;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 22,
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Kicker m={m} />
        <span style={big(m.long ? 52 : 72, 300, '-0.045em')}>{m.digits}</span>
        <EndLine m={m} px={14} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 20,
          top: 172,
          width: 320,
          height: 96,
          borderRadius: 18,
          background: GROUND[m.theme],
          boxShadow: CARD_SHADOW[m.theme],
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: EDGE_MASK, maskImage: EDGE_MASK }}>
          <div
            className="af-tr"
            style={{
              position: 'absolute',
              top: 0,
              left: `${(160 - (m.shownSec / 60) * PX).toFixed(1)}px`,
              width: tw,
              height: 96,
            }}
          >
            {Array.from({ length: tm + 1 }, (_, i) => {
              const major = i % 5 === 0;
              return (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    left: i * PX - (major ? 1 : 0.75),
                    top: major ? 12 : 18,
                    width: major ? 2 : 1.5,
                    height: major ? 24 : 12,
                    borderRadius: 1,
                    background: major ? t.ink : t.ink2,
                    opacity: major ? 0.9 : 0.5,
                  }}
                />
              );
            })}
            {Array.from({ length: Math.floor(tm / 5) + 1 }, (_, k) => (
              <span
                key={k}
                className={L}
                style={{
                  position: 'absolute',
                  left: k * 5 * PX - 20,
                  top: 44,
                  width: 40,
                  textAlign: 'center',
                  fontFamily: MONO,
                  fontSize: lmin(12),
                  color: t.ink2,
                }}
              >
                {k * 5}
              </span>
            ))}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 72,
                width: tw,
                height: 6,
                borderRadius: 3,
                background: heat,
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 160,
              top: 0,
              right: 0,
              bottom: 0,
              background: m.night ? SPENT.night : SPENT.light,
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 159,
            top: 0,
            width: 2,
            height: 96,
            background: m.mc1,
            boxShadow: `0 0 12px ${alpha(m.mc1, 0x99)}`,
          }}
        />
        <svg
          style={{ position: 'absolute', left: 150, top: 0 }}
          width="20"
          height="12"
          viewBox="0 0 20 12"
          aria-hidden="true"
        >
          <path d="M0 0 H20 L10 11 Z" style={{ fill: m.mc1 }} />
        </svg>
      </div>
    </>
  );
}
