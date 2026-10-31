'use client';

import { memo, useMemo, type CSSProperties } from 'react';
import { GridPattern } from '@/components/ui-effects/grid-pattern';
import { Meteors } from '@/components/ui-effects/meteors';
import { cn } from '@/lib/utils';
import type { TVibe, TVibeMotion } from '@/lib/tool/settings';
import type { TWakeState } from '@/lib/wake';

const NOISE_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";
const NOISE_URL = `url(data:image/svg+xml,${encodeURIComponent(NOISE_SVG).replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/'/g, '%27')})`;

const FLOOR_H = Array.from({ length: 9 }, (_, i) => `M0 ${(300 * Math.pow((i + 1) / 9, 2.2)).toFixed(1)}H1000`).join(
  '',
);
const FLOOR_V = Array.from({ length: 29 }, (_, i) => `M${500 + (i - 14) * 12} 0L${500 + (i - 14) * 150} 300`).join('');

// The design's seeded scatter, drawn in the same order so stars, bokeh and dust land where the boards put them.
function scatter(W: number, H: number, night: boolean) {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const stars: CSSProperties[] = [];
  for (let i = 0; i < 70; i++) {
    const sz = rnd() < 0.15 ? 3 : rnd() < 0.5 ? 2 : 1.5;
    stars.push({
      left: Math.round(rnd() * W),
      top: Math.round(rnd() * H * 0.85),
      width: sz,
      height: sz,
      background: rnd() < 0.2 ? '#C1B1FE' : '#FFFFFF',
      animationDelay: `${(rnd() * 3).toFixed(2)}s`,
      boxShadow: `0 0 ${sz * 3}px rgba(255,255,255,.6)`,
    });
  }
  const tints = ['rgba(124,187,255,.22)', 'rgba(159,123,255,.2)', 'rgba(61,245,142,.14)', 'rgba(255,197,61,.14)'];
  const bokeh: CSSProperties[] = [];
  for (let i = 0; i < 10; i++) {
    const r = 30 + Math.round(rnd() * 90);
    bokeh.push({
      left: Math.round(rnd() * W - r / 2),
      top: Math.round(rnd() * H - r / 2),
      width: r,
      height: r,
      background: `radial-gradient(circle, ${tints[i % 4]}, transparent 70%)`,
    });
  }
  const dust: CSSProperties[] = [];
  for (let i = 0; i < 28; i++) {
    const sz = rnd() < 0.3 ? 2 : 1.2;
    dust.push({
      left: Math.round(rnd() * W),
      top: Math.round(rnd() * H * 0.55),
      width: sz,
      height: sz,
      background: night ? '#FFFFFF' : '#5C6275',
      animationDelay: `${(rnd() * 3).toFixed(2)}s`,
    });
  }
  return { stars, bokeh, dust };
}

const rain = (w: number, a: number, op: number): CSSProperties => ({
  backgroundImage: `repeating-linear-gradient(102deg, transparent 0 ${w}px, rgba(190,210,255,${a}) ${w}px ${w + 1}px, transparent ${w + 1}px ${w * 2}px)`,
  backgroundSize: '120px 900px',
  opacity: op,
  maskImage: 'linear-gradient(180deg, transparent, #000 20%, #000 80%, transparent)',
});

const TINT: Partial<Record<TWakeState, [string, string]>> = {
  running: ['rgba(61,245,142,.07)', 'rgba(17,122,59,.05)'],
  paused: ['rgba(255,197,61,.08)', 'rgba(138,90,0,.06)'],
  blocked: ['rgba(255,107,129,.09)', 'rgba(194,29,62,.06)'],
  ended: ['rgba(124,187,255,.05)', 'rgba(28,100,184,.04)'],
};

interface IBackdropProps {
  W: number;
  H: number;
  night: boolean;
  narrow: boolean;
  topH: number;
  vibe: TVibe;
  motion: TVibeMotion;
  still: boolean;
  state: TWakeState;
}

// Every vibe sits under the same state tint, grid, spotlight, vignette and grain; the whole layer dims to
// --vibe-opacity on OLED and every animation stops on Still, battery saver and reduced motion.
export const Backdrop = memo(function Backdrop({
  W,
  H,
  night,
  narrow,
  topH,
  vibe,
  motion,
  still,
  state,
}: IBackdropProps) {
  const dots = useMemo(() => scatter(W, H, night), [W, H, night]);
  const tint = TINT[state]?.[night ? 0 : 1] ?? 'transparent';
  const lava = (col: string, l: number, t: number, sz: number): CSSProperties => ({
    left: Math.round(W * l),
    top: Math.round(H * t),
    width: Math.round(W * sz),
    height: Math.round(W * sz),
    borderRadius: '42% 58% 63% 37% / 41% 44% 56% 59%',
    background: col,
    filter: 'blur(70px)',
    opacity: night ? 0.55 : 0.35,
  });
  const blob = 'absolute rounded-full';
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-(--vibe-opacity)',
        (still || motion === 'still') && 'tg-still',
        motion === 'lively' && !still && 'tg-lively',
      )}
    >
      {vibe === 'aurora' ? (
        <>
          <div
            className={cn(blob, 'tg-drift')}
            style={{
              left: -W * 0.15,
              top: -H * 0.25,
              width: W * 0.75,
              height: W * 0.75,
              background: `radial-gradient(closest-side, ${night ? `rgba(61,245,142,${state === 'running' ? 0.22 : 0.13})` : 'rgba(17,122,59,.10)'}, transparent 70%)`,
            }}
          />
          <div
            className={cn(blob, 'tg-drift2')}
            style={{
              right: -W * 0.2,
              bottom: -H * 0.35,
              width: W * 0.85,
              height: W * 0.85,
              background: `radial-gradient(closest-side, ${night ? 'rgba(124,92,255,.24)' : 'rgba(102,51,245,.10)'}, transparent 70%)`,
            }}
          />
          <div
            className={cn(blob, 'tg-drift')}
            style={{
              left: W * 0.45,
              top: H * 0.05,
              width: W * 0.4,
              height: W * 0.4,
              background: `radial-gradient(closest-side, ${night ? 'rgba(124,187,255,.10)' : 'rgba(28,100,184,.06)'}, transparent 70%)`,
            }}
          />
          <div
            className="tg-rib absolute left-[-20%] w-[140%] origin-[50%_0] opacity-85"
            style={{
              top: -H * 0.08,
              height: Math.round(H * 0.42),
              background: `linear-gradient(90deg, transparent 4%, ${night ? 'rgba(61,245,142,.30)' : 'rgba(17,122,59,.12)'} 22%, ${night ? 'rgba(124,240,200,.22)' : 'rgba(14,143,106,.08)'} 38%, ${night ? 'rgba(124,187,255,.18)' : 'rgba(28,100,184,.07)'} 55%, ${night ? 'rgba(159,123,255,.28)' : 'rgba(102,51,245,.10)'} 74%, transparent 96%)`,
              maskImage: 'linear-gradient(180deg, transparent, #000 40%, #000 50%, transparent)',
            }}
          />
          <div
            className="tg-rib2 absolute left-[-10%] w-[120%] origin-[50%_0] opacity-70"
            style={{
              top: Math.round(H * 0.04),
              height: Math.round(H * 0.3),
              background: `linear-gradient(90deg, transparent 10%, ${night ? 'rgba(159,123,255,.20)' : 'rgba(102,51,245,.07)'} 30%, ${night ? 'rgba(61,245,142,.22)' : 'rgba(17,122,59,.08)'} 60%, transparent 90%)`,
              maskImage: 'linear-gradient(180deg, transparent, #000 45%, transparent)',
            }}
          />
          {dots.dust.map((s, i) => (
            <span key={i} className="tg-tw absolute rounded-full opacity-50" style={s} />
          ))}
          <svg
            className="absolute bottom-0 left-0"
            style={{
              width: W,
              height: Math.round(H * 0.34),
              maskImage: 'linear-gradient(180deg, transparent 0%, #000 60%)',
              opacity: night ? 0.9 : 0.7,
            }}
            viewBox="0 0 1000 300"
            preserveAspectRatio="none"
          >
            <path
              d={FLOOR_H}
              stroke={night ? 'rgba(61,245,142,.18)' : 'rgba(17,122,59,.14)'}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              fill="none"
            />
            <path
              d={FLOOR_V}
              stroke={night ? 'rgba(159,123,255,.16)' : 'rgba(102,51,245,.12)'}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              fill="none"
            />
          </svg>
          <div
            className="absolute inset-x-0 h-px opacity-70"
            style={{
              bottom: Math.round(H * 0.335),
              background: `linear-gradient(90deg, transparent, ${night ? 'rgba(124,240,200,.35)' : 'rgba(17,122,59,.25)'}, transparent)`,
              boxShadow: `0 0 40px 8px ${night ? 'rgba(61,245,142,.10)' : 'rgba(17,122,59,.06)'}`,
            }}
          />
        </>
      ) : null}
      <div
        className="absolute inset-0 transition-[background] duration-600"
        style={{ background: `radial-gradient(ellipse 70% 60% at 50% 55%, ${tint}, transparent 70%)` }}
      />
      {vibe === 'night' ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: night
                ? 'radial-gradient(ellipse 120% 70% at 50% 120%, rgba(124,92,255,.22), transparent 60%), linear-gradient(180deg, #03040B 0%, #070B1F 60%, #0B1030 100%)'
                : 'linear-gradient(180deg, #E9ECFA, #F4F4F9)',
            }}
          />
          {dots.stars.map((s, i) => (
            <span key={i} className="tg-tw absolute rounded-full" style={s} />
          ))}
          <div
            className="tg-sun absolute rounded-full"
            style={{
              right: narrow ? 18 : Math.round(W * 0.1),
              top: narrow ? topH + 6 : Math.round(H * 0.12),
              width: narrow ? 54 : 120,
              height: narrow ? 54 : 120,
              opacity: narrow ? 0.75 : 1,
              background: 'radial-gradient(circle at 40% 40%, #FFF9E8, #E9DDB4 55%, rgba(233,221,180,0) 72%)',
              boxShadow: '0 0 120px 40px rgba(233,221,180,.12)',
            }}
          />
          <Meteors meteors={[{ left: Math.round(W - W * 0.12 - 140), top: Math.round(H * 0.18) }]} />
        </>
      ) : null}
      {vibe === 'rain' ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: night
                ? 'linear-gradient(180deg, #0A0F1A, #0D1626 60%, #0A0F1A)'
                : 'linear-gradient(180deg, #DDE5F0, #EEF2F7)',
            }}
          />
          {dots.bokeh.map((s, i) => (
            <span key={i} className="absolute rounded-full blur-[6px]" style={s} />
          ))}
          <div className="tg-rain2 absolute -inset-10" style={rain(14, night ? 0.18 : 0.25, 0.7)} />
          <div className="tg-rain absolute -inset-10" style={rain(9, night ? 0.32 : 0.4, 0.9)} />
        </>
      ) : null}
      {vibe === 'sunset' ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: night
                ? 'linear-gradient(180deg, #120821 0%, #3A1647 42%, #8E2F57 70%, #D9644A 88%, #F2A35E 100%)'
                : 'linear-gradient(180deg, #FCE7DA 0%, #F9C6B4 55%, #F6A07A 100%)',
            }}
          />
          <div
            className="tg-sun absolute left-1/2 rounded-full"
            style={{
              bottom: -Math.round(H * 0.08),
              width: Math.round(W * 0.34),
              height: Math.round(W * 0.34),
              marginLeft: -Math.round(W * 0.17),
              background: 'radial-gradient(circle, #FFE3A8 0%, #FFB36B 45%, rgba(255,140,90,0) 70%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-[40%] bg-[linear-gradient(180deg,transparent,rgba(255,170,120,.18))]" />
        </>
      ) : null}
      {vibe === 'lava' ? (
        <>
          <div className="tg-lava absolute" style={lava('#3DF58E', -0.05, 0.1, 0.4)} />
          <div className="tg-lava2 absolute" style={lava('#9F7BFF', 0.55, 0.45, 0.45)} />
          <div className="tg-lava absolute" style={lava('#FF6BB4', 0.6, -0.1, 0.32)} />
          <div className="tg-lava2 absolute" style={lava('#FFC53D', 0.1, 0.6, 0.3)} />
        </>
      ) : null}
      {vibe !== 'aurora' ? (
        <GridPattern
          width={64}
          height={64}
          x={0}
          y={0}
          className="stroke-(--tg-grid)"
          style={{ maskImage: 'radial-gradient(ellipse 60% 55% at 50% 45%, #000 30%, transparent 75%)' }}
        />
      ) : null}
      <div
        className="absolute left-1/2"
        style={{
          top: -Math.round(H * 0.35),
          width: Math.round(W * 0.9),
          height: Math.round(H),
          marginLeft: -Math.round(W * 0.45),
          background: `radial-gradient(ellipse 50% 50% at 50% 30%, ${night ? 'rgba(220,226,255,.07)' : 'rgba(255,255,255,.9)'}, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 50%, ${vibe === 'sunset' || vibe === 'lava' ? (night ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.2)') : 'transparent'} 30%, ${night ? 'rgba(0,0,0,.55)' : 'rgba(244,244,249,.6)'})`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: NOISE_URL,
          backgroundSize: '180px 180px',
          opacity: night ? 0.06 : 0.035,
          mixBlendMode: night ? 'overlay' : 'multiply',
        }}
      />
    </div>
  );
});
