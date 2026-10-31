import { memo } from 'react';

function ticks() {
  let minor = '';
  let major = '';
  for (let i = 0; i < 120; i++) {
    const a = (i * 3 * Math.PI) / 180;
    const maj = i % 10 === 0;
    const r1 = 496;
    const r2 = maj ? 470 : i % 2 ? 488 : 482;
    const p = `M${(500 + Math.sin(a) * r1).toFixed(1)} ${(500 - Math.cos(a) * r1).toFixed(1)}L${(500 + Math.sin(a) * r2).toFixed(1)} ${(500 - Math.cos(a) * r2).toFixed(1)}`;
    if (maj) major += p;
    else minor += p;
  }
  return { minor, major };
}

const TICKS = ticks();
const CIRC = 2 * Math.PI * 340;

// The time orbit around the clock: 120 ticks turning once in 240 s, a dashed and a plain ring turning back in
// 360 s, and the progress orbit (volt to violet) whose glowing dot marks the time left.
export const Orbit = memo(function Orbit({ frac, opacity }: { frac: number; opacity: number }) {
  const ang = frac * 2 * Math.PI;
  return (
    <>
      <svg className="tg-orb absolute inset-0" viewBox="0 0 1000 1000" width="100%" height="100%">
        <circle cx="500" cy="500" r="496" fill="none" style={{ stroke: 'var(--tg-orbit-line)' }} strokeWidth="1.2" />
        <path d={TICKS.minor} style={{ stroke: 'var(--tg-orbit-tick)' }} strokeWidth="2" strokeLinecap="round" />
        <path d={TICKS.major} style={{ stroke: 'var(--tg-orbit-tick-hi)' }} strokeWidth="3" strokeLinecap="round" />
      </svg>
      <svg className="tg-orbR absolute inset-0" viewBox="0 0 1000 1000" width="100%" height="100%">
        <circle
          cx="500"
          cy="500"
          r="400"
          fill="none"
          style={{ stroke: 'var(--tg-orbit-line)' }}
          strokeWidth="1"
          strokeDasharray="2 10"
        />
        <circle cx="500" cy="500" r="330" fill="none" style={{ stroke: 'var(--tg-orbit-line)' }} strokeWidth="1" />
      </svg>
      <svg className="absolute inset-0" viewBox="0 0 1000 1000" width="100%" height="100%">
        <defs>
          <linearGradient id="tg-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--tg-volt)' }} />
            <stop offset="1" style={{ stopColor: 'var(--tg-violet)' }} />
          </linearGradient>
        </defs>
        <circle
          cx="500"
          cy="500"
          r="340"
          fill="none"
          stroke="url(#tg-arc)"
          strokeWidth="3"
          strokeLinecap="round"
          transform="rotate(-90 500 500)"
          style={{ strokeDasharray: `${(CIRC * Math.max(0.0001, frac)).toFixed(1)} ${CIRC.toFixed(1)}`, opacity }}
        />
        <circle
          cx={(500 + Math.sin(ang) * 340).toFixed(1)}
          cy={(500 - Math.cos(ang) * 340).toFixed(1)}
          r="7"
          style={{ opacity, fill: 'var(--tg-volt)' }}
        />
      </svg>
    </>
  );
});
