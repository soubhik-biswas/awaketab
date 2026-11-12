'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ILight {
  name: 'h' | 'b' | 'w';
  lag: number;
  x: number;
  y: number;
}

const PASS = 10000;
const PAUSE = 6000;
const VIEW_WIDTH = 828.2;
const smooth = (t: number): number => t * t * (3 - 2 * t);

// The light on the footer's wordmark: three spots that trail the pointer, a slow sheen while nobody is near, a
// bloom on the way in and an afterglow on the way out. Each frame writes custom properties only, and frames run
// only while the wordmark is on screen and something is still moving.
export function WordmarkLight({ children }: { children: ReactNode }) {
  const row = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const giant = row.current;
    const foot = giant?.closest('footer');
    if (!giant || !foot) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    // Hot spot, core beam and wash: each trails the pointer by its own amount.
    const wash: ILight = { name: 'w', lag: 0.08, x: 0, y: 0 };
    const lights: readonly ILight[] = [
      { name: 'h', lag: 0.22, x: 0, y: 0 },
      { name: 'b', lag: 0.14, x: 0, y: 0 },
      wash,
    ];
    const aimAt = { x: 0, y: 0 };
    let box = { w: 0, h: 0 };
    let seen = false;
    let hovering = false;
    let overFoot = false;
    let power = 0;
    let scale = 1;
    let sheen = 0;
    let passStart = 0;
    let sheenTimer = 0;
    let frame = 0;
    let last = 0;

    const paint = () => {
      const style = giant.style;
      for (const light of lights) {
        style.setProperty(`--${light.name}x`, `${light.x.toFixed(1)}px`);
        style.setProperty(`--${light.name}y`, `${light.y.toFixed(1)}px`);
      }
      style.setProperty('--lit', smooth(power).toFixed(3));
      style.setProperty('--k', scale.toFixed(3));
      style.setProperty('--sheen', sheen.toFixed(3));
    };

    const startPass = () => {
      window.clearTimeout(sheenTimer);
      if (!seen || hovering || overFoot || power > 0) return;
      if (still.matches) {
        wash.x = box.w / 2;
        wash.y = box.h * 0.55;
        sheen = 1;
        paint();
        return;
      }
      passStart = performance.now();
      run();
    };
    const queuePass = (delay: number) => {
      window.clearTimeout(sheenTimer);
      sheenTimer = window.setTimeout(startPass, delay);
    };
    const stopSheen = () => {
      window.clearTimeout(sheenTimer);
      passStart = 0;
      if (still.matches) sheen = 0;
    };

    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      let busy = false;
      if (hovering) {
        for (const light of lights) {
          const ease = still.matches ? 1 : 1 - (1 - light.lag) ** (dt / 16.7);
          light.x += (aimAt.x - light.x) * ease;
          light.y += (aimAt.y - light.y) * ease;
          if (Math.abs(aimAt.x - light.x) + Math.abs(aimAt.y - light.y) > 0.1) busy = true;
        }
        power = still.matches ? 1 : Math.min(1, power + dt / 320);
        scale += (1 - scale) * (still.matches ? 1 : 1 - Math.exp(-dt / 110));
        if (power < 1 || 1 - scale > 0.002) busy = true;
      } else if (power > 0) {
        power = still.matches ? 0 : Math.max(0, power - dt / 900);
        scale += (0.86 - scale) * (1 - Math.exp(-dt / 380));
        busy = power > 0;
      }
      if (passStart) {
        const t = (now - passStart) / PASS;
        if (t >= 1) {
          passStart = 0;
          sheen = 0;
          sheenTimer = window.setTimeout(startPass, PAUSE);
        } else {
          wash.x = box.w * (-0.2 + 1.4 * (0.5 - 0.5 * Math.cos(Math.PI * t)));
          wash.y = box.h * 0.55;
          sheen = Math.sin(Math.PI * t) ** 0.8;
          scale = 1;
          busy = true;
        }
      } else if (sheen > 0 && !still.matches) {
        sheen = Math.max(0, sheen - dt / 320);
        busy = sheen > 0;
      }
      paint();
      frame = busy && seen ? requestAnimationFrame(tick) : 0;
    };
    function run() {
      if (frame || !seen) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    const aim = (event: PointerEvent) => {
      const rect = giant.getBoundingClientRect();
      aimAt.x = event.clientX - rect.left;
      aimAt.y = event.clientY - rect.top;
      if (!hovering) {
        hovering = true;
        stopSheen();
        // The light blooms from where the pointer came in; a sheen already on the word glides over to it instead.
        const fresh = power < 0.02;
        for (const light of lights) {
          if (light === wash ? fresh && sheen < 0.02 : fresh) Object.assign(light, aimAt);
        }
        if (fresh) scale = still.matches ? 1 : 0.6;
      }
      run();
    };
    const release = () => {
      if (!hovering) return;
      hovering = false;
      run();
      if (!overFoot) queuePass(2000);
    };
    const enterFoot = () => {
      overFoot = true;
      stopSheen();
      run();
    };
    const leaveFoot = () => {
      overFoot = false;
      queuePass(2000);
    };
    const motionChanged = () => {
      stopSheen();
      sheen = 0;
      paint();
      queuePass(600);
    };

    giant.addEventListener('pointerenter', aim);
    giant.addEventListener('pointerdown', aim);
    giant.addEventListener('pointermove', aim);
    giant.addEventListener('pointerleave', release);
    giant.addEventListener('pointercancel', release);
    foot.addEventListener('pointerenter', enterFoot);
    foot.addEventListener('pointerleave', leaveFoot);
    still.addEventListener('change', motionChanged);

    const onScreen = new IntersectionObserver(([entry]) => {
      seen = entry?.isIntersecting ?? false;
      if (seen) {
        queuePass(1200);
        run();
      } else stopSheen();
    });
    onScreen.observe(giant);

    const sized = new ResizeObserver(() => {
      box = { w: giant.clientWidth, h: giant.clientHeight };
      if (!box.w) return;
      giant.style.setProperty('--row-w', `${box.w}px`);
      // The outline keeps a readable width on small screens: about 0.9 px on a phone, 1.25 px at 1440, 2 px at most.
      const px = Math.min(2, Math.max(0.9, box.w * 0.001));
      giant.style.setProperty('--giant-stroke', ((px * VIEW_WIDTH) / box.w).toFixed(3));
      giant.style.setProperty('--giant-stroke-lit', (((px + 0.6) * VIEW_WIDTH) / box.w).toFixed(3));
    });
    sized.observe(giant);

    return () => {
      window.clearTimeout(sheenTimer);
      cancelAnimationFrame(frame);
      giant.removeEventListener('pointerenter', aim);
      giant.removeEventListener('pointerdown', aim);
      giant.removeEventListener('pointermove', aim);
      giant.removeEventListener('pointerleave', release);
      giant.removeEventListener('pointercancel', release);
      foot.removeEventListener('pointerenter', enterFoot);
      foot.removeEventListener('pointerleave', leaveFoot);
      still.removeEventListener('change', motionChanged);
      onScreen.disconnect();
      sized.disconnect();
    };
  }, []);

  return (
    <div ref={row} className="site-foot-giant" aria-hidden="true">
      {children}
    </div>
  );
}
