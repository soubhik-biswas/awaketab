import { type ReactNode, useRef } from 'react';
import { cn } from 'cn';
import { CASE, plate } from './art';
import { L, lmin, type TStyle } from './kit';
import type { TFaceId, TFaceModel, TFaceState } from './model';
import { useFaceMotion } from './motion';
import './face.css';

const PLATED: ReadonlySet<TFaceId> = new Set<TFaceId>([
  'ring',
  'analog',
  'luxe',
  'rings',
  'dive',
  'chrono',
  'pilot',
  'dots',
  'orbit',
  'disc',
  'skeleton',
  'waveform',
]);

// Faces that draw their own card or panel stay out of the watch-glass case.
const CASELESS: ReadonlySet<TFaceId> = new Set<TFaceId>([
  'horizon',
  'tide',
  'lcd',
  'board',
  'wordgrid',
  'clocks',
  'tape',
  'timeline',
  'aurora',
  'glass',
  'neon',
  'eclipse',
  'bauhaus',
  'poster',
  'eink',
  'blob',
  'hud',
  'constellation',
]);

function StateIcon({ state, c }: { state: TFaceState; c: string }) {
  const body = {
    running: (
      <>
        <circle className="afx-pulse" cx="8" cy="8" r="5" style={{ fill: c }} opacity=".5" />
        <circle cx="8" cy="8" r="4" style={{ fill: c }} />
      </>
    ),
    starting: <circle cx="8" cy="8" r="6" fill="none" strokeWidth="2" strokeDasharray="3 3" style={{ stroke: c }} />,
    fallback: (
      <>
        <rect x="1.5" y="3" width="13" height="10" rx="2.5" fill="none" strokeWidth="1.8" style={{ stroke: c }} />
        <path d="M6.5 6 L10.5 8 L6.5 10 Z" style={{ fill: c }} />
      </>
    ),
    paused: (
      <>
        <rect x="3.5" y="2.5" width="3" height="11" rx="1" style={{ fill: c }} />
        <rect x="9.5" y="2.5" width="3" height="11" rx="1" style={{ fill: c }} />
      </>
    ),
    blocked: (
      <>
        <circle cx="8" cy="8" r="6.2" fill="none" strokeWidth="1.8" style={{ stroke: c }} />
        <path d="M3.8 12.2 L12.2 3.8" strokeWidth="1.8" style={{ stroke: c }} />
      </>
    ),
    unsupported: (
      <>
        <path d="M8 1.5 L14.5 13.5 H1.5 Z" fill="none" strokeWidth="1.6" strokeLinejoin="round" style={{ stroke: c }} />
        <path d="M8 6 V9.5 M8 11.2 V11.6" strokeWidth="1.8" strokeLinecap="round" style={{ stroke: c }} />
      </>
    ),
    up: (
      <>
        <path
          d="M4 11 V7.5 a4 4 0 0 1 8 0 V11 L13 12.5 H3 Z"
          fill="none"
          strokeWidth="1.7"
          strokeLinejoin="round"
          style={{ stroke: c }}
        />
        <path d="M6.6 14 h2.8" strokeWidth="1.7" strokeLinecap="round" style={{ stroke: c }} />
      </>
    ),
    idle: <circle cx="8" cy="8" r="5.5" fill="none" strokeWidth="1.8" style={{ stroke: c }} />,
  }[state];
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      {body}
    </svg>
  );
}

// The face's root: the 360 × 315 artboard scaled to size with one transform, the dial plate, the drawing and, unless
// bare, the status caption below it.
export function FaceFrame({
  m,
  bare,
  framed,
  drawn = true,
  className,
  children,
}: {
  m: TFaceModel;
  bare?: boolean | undefined;
  framed?: boolean | undefined;
  drawn?: boolean;
  className?: string | undefined;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFaceMotion(ref, m.live && drawn, `${m.face}|${m.live}`);
  const root: TStyle = {
    width: m.size,
    height: m.boxH,
    color: m.t.ink,
    '--lmin': `${m.LMIN.toFixed(2)}px`,
    '--fl': m.lampValue,
    '--fa': m.accentValue,
  };
  return (
    <div
      ref={ref}
      className={cn(
        'af',
        m.theme,
        m.live && 'af-live',
        m.still && 'af-still',
        m.compact && 'af-compact',
        m.thumb && 'af-thumb',
        className,
      )}
      role="timer"
      aria-label={m.aria}
      data-face={m.face}
      data-state={m.st}
      style={root}
    >
      <div className="af-a" aria-hidden="true" style={{ transform: `scale(${m.size / 360})` }}>
        {framed && !CASELESS.has(m.face) && (
          <div
            style={{
              position: 'absolute',
              left: 6,
              top: 6,
              width: 348,
              height: bare ? 348 : 304,
              borderRadius: 72,
              ...CASE[m.theme],
            }}
          />
        )}
        {PLATED.has(m.face) && (
          <div
            style={{
              position: 'absolute',
              left: 34,
              top: 9,
              width: 292,
              height: 292,
              borderRadius: '50%',
              ...plate(m.theme, m.accent),
            }}
          />
        )}
        {children}
        {!bare && (
          <div
            className={L}
            style={{
              position: 'absolute',
              left: 0,
              top: 318,
              width: 360,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: m.accent,
              fontSize: lmin(15),
              fontWeight: 500,
            }}
          >
            <StateIcon state={m.st} c={m.accent} />
            <span>{m.capText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
