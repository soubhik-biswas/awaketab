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
// The face box is px wide and 0.875 px tall, so its corners sit 0.664 px from the centre; rings keep 0.05 px more.
const CORNER = 0.714;

// The time orbit behind the clock: 120 ticks turning once in 240 s and a dashed ring turning back in 360 s. A ring
// is drawn only when it clears the corners of the face's box, so it never crosses a wide face; the face alone
// shows the time left.
export const Orbit = memo(function Orbit({ px, rings }: { px: number; rings: number }) {
  const clear = rings > 0 ? (CORNER * px * 1000) / rings : 1000;
  const tick = clear <= 470;
  const dash = clear <= 430;
  if (!tick && !dash) return null;
  return (
    <>
      {tick ? (
        <svg className="tg-orb absolute inset-0" viewBox="0 0 1000 1000" width="100%" height="100%">
          <circle cx="500" cy="500" r="496" fill="none" style={{ stroke: 'var(--tg-orbit-line)' }} strokeWidth="1.2" />
          <path d={TICKS.minor} style={{ stroke: 'var(--tg-orbit-tick)' }} strokeWidth="2" strokeLinecap="round" />
          <path d={TICKS.major} style={{ stroke: 'var(--tg-orbit-tick-hi)' }} strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : null}
      {dash ? (
        <svg className="tg-orbR absolute inset-0" viewBox="0 0 1000 1000" width="100%" height="100%">
          <circle
            cx="500"
            cy="500"
            r="430"
            fill="none"
            style={{ stroke: 'var(--tg-orbit-line)' }}
            strokeWidth="1"
            strokeDasharray="2 10"
          />
        </svg>
      ) : null}
    </>
  );
});
