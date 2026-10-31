import type { ReactNode } from 'react';
import { alpha, f1, P, sectorPath, ticks } from '../geometry';
import { D, hand, type IDrawProps, Svg } from '../kit';
import type { TFaceModel } from '../model';

const SUNBURST = {
  light: 'repeating-conic-gradient(rgba(11,16,32,.025) 0 2deg, transparent 2deg 4deg)',
  night: 'repeating-conic-gradient(rgba(255,255,255,.028) 0 2deg, transparent 2deg 4deg)',
};
const DAUPHINE = { clipPath: 'polygon(50% 0, 100% 82%, 50% 100%, 0 82%)' };
const MINOR = ticks(124, 130, 60, (i) => i % 5 !== 0);
const MAJOR = ticks(108, 130, 12);
const LUXE_MINOR = ticks(126, 130, 60, (i) => i % 5 !== 0);
const LUXE_MAJOR = ticks(114, 130, 12, (i) => i % 3 !== 0);

// The minutes left as degrees on the minute track (one minute = 6°), capped just under a full turn.
export const minutesSpan = (m: TFaceModel): number => Math.min(359.9, (m.st === 'idle' ? m.total : m.r) / 10);

// Analog and Analog luxe: real time on the hands, the lamp sector running from now to the end time.
export function AnalogDial({ m, luxe, children }: IDrawProps & { luxe: boolean; children?: ReactNode }) {
  const { t, accent } = m;
  const spanN = minutesSpan(m);
  const [ex, ey] = P(136, m.minDeg + spanN);
  const ink = luxe ? `linear-gradient(90deg, ${t.ink} 50%, ${t.ink2} 50%)` : t.ink;
  const sectorC = alpha(accent, luxe ? 0x22 : m.theme === 'light' ? 0x2a : 0x38);
  return (
    <>
      {luxe && (
        <div
          style={{
            position: 'absolute',
            left: 34,
            top: 9,
            width: 292,
            height: 292,
            borderRadius: '50%',
            background: m.night ? SUNBURST.night : SUNBURST.light,
          }}
        />
      )}
      <Svg>
        <path d={sectorPath(luxe ? 62 : 96, 134, m.minDeg, m.minDeg + spanN)} style={{ fill: sectorC }} />
        {luxe && (
          <>
            <circle cx="180" cy="155" r="130" fill="none" strokeWidth="1" style={{ stroke: t.line }} />
            <circle cx="180" cy="155" r="100" fill="none" strokeWidth="1" opacity=".6" style={{ stroke: t.line }} />
          </>
        )}
        <path
          className={D}
          d={luxe ? LUXE_MINOR : MINOR}
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity=".5"
          style={{ stroke: t.ink2 }}
        />
        <path
          d={luxe ? LUXE_MAJOR : MAJOR}
          strokeWidth={luxe ? 4 : 5}
          strokeLinecap="round"
          style={{ stroke: t.ink }}
        />
        <circle cx={f1(ex)} cy={f1(ey)} r="6" style={{ fill: accent }} />
        <circle className="afx-pulse" cx={f1(ex)} cy={f1(ey)} r="6" opacity={m.haloOp} style={{ fill: accent }} />
      </Svg>
      {children}
      <div
        className="afx-h"
        style={
          luxe
            ? hand(72, 0, 14, m.hourDeg, m.hourDeg0, ink, DAUPHINE)
            : hand(70, 14, 8, m.hourDeg, m.hourDeg0, ink, { borderRadius: 4 })
        }
      />
      <div
        className="afx-m"
        style={
          luxe
            ? hand(112, 0, 12, m.minDeg, m.minDeg0, ink, DAUPHINE)
            : hand(110, 16, 6, m.minDeg, m.minDeg0, ink, { borderRadius: 3 })
        }
      />
      <div className="afx-s" style={hand(124, 30, 2, m.secDeg, m.secDeg0, accent)}>
        <span
          style={{
            position: 'absolute',
            left: -4,
            bottom: 14,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: accent,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 173,
          top: 148,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: accent,
          border: `3px solid ${t.panel}`,
        }}
      />
    </>
  );
}
