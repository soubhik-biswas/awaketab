'use client';

import { useState } from 'react';
import { CARD_SHADOW } from '../art';
import { alpha } from '../geometry';
import { big, EndLine, type IDrawProps, Kicker, L, lmin, MONO, PLATE } from '../kit';

const PX = 14;
const NEEDLE = 160;
// Minutes drawn either side of the needle: the plate shows about eleven, the rest stays hidden under the edge fade.
const SPAN = 13;
const GROUND = {
  light: 'linear-gradient(180deg, #FFFFFF, #EFEFF6)',
  dark: 'linear-gradient(180deg, #14161D, #0A0B10)',
  oled: '#05070C',
};
const SPENT = { light: 'rgba(246,244,239,.62)', night: 'rgba(7,11,22,.62)' };
const EDGE_MASK = 'linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)';

const mark = (min: number): string => {
  if (min < 60) return String(min);
  const mm = min % 60;
  return `${Math.floor(min / 60)}h${mm ? String(mm).padStart(2, '0') : ''}`;
};

// A minute ruler glides under a fixed needle; the heat strip shows the final stretch.
export default function Tape({ m }: IDrawProps) {
  const { t } = m;
  const now = m.shownSec / 60;
  // The window also covers where the ruler was a second ago, so a jump of many minutes glides past drawn ticks.
  const [trail, setTrail] = useState({ now, was: now });
  if (trail.now !== now) setTrail({ now, was: trail.now });
  const end = m.indef ? Infinity : Math.max(5, Math.ceil(m.total / 60));
  const lo = Math.max(0, Math.floor(Math.min(now, trail.was)) - SPAN);
  const hi = Math.min(end, Math.ceil(Math.max(now, trail.was)) + SPAN);
  const count = Math.max(0, hi - lo + 1);
  const hc = m.heat(m.frac);
  // A session without an end has no final stretch, so its strip is one even colour.
  const heat = m.indef
    ? { backgroundImage: 'none', backgroundColor: alpha(hc, 0x88), backgroundSize: 'auto', backgroundPosition: '0 0' }
    : {
        backgroundImage: `linear-gradient(90deg, ${alpha(hc, 0x55)}, ${hc})`,
        backgroundColor: 'transparent',
        backgroundSize: `${end * PX}px 100%`,
        backgroundPosition: `${-lo * PX}px 0`,
      };
  // Counting down, the minutes past the needle are spent; counting up, the minutes behind it are.
  const spent = m.indef ? { left: 0, width: NEEDLE } : { left: NEEDLE, right: 0 };
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
        className={PLATE}
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
          isolation: 'isolate',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: EDGE_MASK, maskImage: EDGE_MASK }}>
          <div
            className="af-tr"
            style={{ position: 'absolute', top: 0, left: `${(NEEDLE - now * PX).toFixed(1)}px`, width: 0, height: 96 }}
          >
            {Array.from({ length: count }, (_, j) => {
              const i = lo + j;
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
            {Array.from({ length: count }, (_, j) => lo + j)
              .filter((i) => i % 5 === 0)
              .map((i) => (
                <span
                  key={`n${i}`}
                  className={L}
                  style={{
                    position: 'absolute',
                    left: i * PX - 22,
                    top: 44,
                    width: 44,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    fontFamily: MONO,
                    fontSize: lmin(12),
                    color: t.ink2,
                  }}
                >
                  {mark(i)}
                </span>
              ))}
            <div
              style={{
                position: 'absolute',
                left: lo * PX,
                top: 72,
                width: (hi - lo) * PX,
                height: 6,
                borderRadius: 3,
                ...heat,
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              ...spent,
              background: m.night ? SPENT.night : SPENT.light,
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            left: NEEDLE - 1,
            top: 0,
            width: 2,
            height: 96,
            background: m.mc1,
            boxShadow: `0 0 12px ${alpha(m.mc1, 0x99)}`,
          }}
        />
        <svg
          style={{ position: 'absolute', left: NEEDLE - 10, top: 0 }}
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
