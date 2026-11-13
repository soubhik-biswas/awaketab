'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

interface IBorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}

interface IBox {
  w: number;
  h: number;
  r: number;
}

// The parent's real outline: its size and its corner radius, capped the way the browser caps a pill's.
function useOutline(el: SVGSVGElement | null): IBox | null {
  const [box, setBox] = useState<IBox | null>(null);
  useLayoutEffect(() => {
    const host = el?.parentElement;
    const win = el?.ownerDocument.defaultView;
    if (!host || !win) return;
    const read = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      const r = Math.min(parseFloat(win.getComputedStyle(host).borderTopLeftRadius) || 0, w / 2, h / 2);
      setBox((b) => (b && b.w === w && b.h === h && b.r === r ? b : { w, h, r }));
    };
    read();
    const ro = new win.ResizeObserver(read);
    ro.observe(host);
    return () => ro.disconnect();
  }, [el]);
  return box;
}

// A light that runs along the element's own rounded edge at an even speed: a bright head with a fading tail, drawn
// as dashes on one stroke so it never leaves the outline. It rests in place under reduced motion.
export function BorderBeam({
  size = 120,
  duration = 6,
  delay = 0,
  colorFrom = 'var(--tg-volt)',
  colorTo = 'var(--tg-violet)',
  borderWidth = 1.5,
}: IBorderBeamProps) {
  const [el, setEl] = useState<SVGSVGElement | null>(null);
  const box = useOutline(el);
  const half = borderWidth / 2;
  const perimeter = box ? 2 * (box.w + box.h) - (8 - 2 * Math.PI) * Math.max(0, box.r - half) : 0;
  const tail = perimeter ? Math.min(45, (size / perimeter) * 100) : 0;

  useEffect(() => {
    const win = el?.ownerDocument.defaultView;
    if (!el || !win || !tail || win.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const runs = Array.from(el.querySelectorAll<SVGRectElement>('rect'), (rect) => {
      const from = Number(rect.dataset.from);
      return rect.animate([{ strokeDashoffset: String(from) }, { strokeDashoffset: String(from - 100) }], {
        duration: duration * 1000,
        delay: -delay * 1000,
        iterations: Infinity,
        easing: 'linear',
      });
    });
    return () => runs.forEach((run) => run.cancel());
  }, [el, tail, duration, delay]);

  const layers: Array<[number, string, number]> = [
    [tail, colorTo, 0.35],
    [tail * 0.55, colorTo, 0.8],
    [tail * 0.22, colorFrom, 1],
  ];
  return (
    <svg
      ref={setEl}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
      width={box?.w}
      height={box?.h}
    >
      {box && tail
        ? layers.map(([len, color, opacity], i) => {
            const from = len - tail;
            return (
              <rect
                key={i}
                data-from={from}
                x={half}
                y={half}
                width={Math.max(0, box.w - borderWidth)}
                height={Math.max(0, box.h - borderWidth)}
                rx={Math.max(0, box.r - half)}
                pathLength={100}
                fill="none"
                strokeWidth={borderWidth}
                strokeLinecap="round"
                strokeDasharray={`${len} ${100 - len}`}
                strokeDashoffset={from}
                style={{ stroke: color, opacity }}
              />
            );
          })
        : null}
    </svg>
  );
}
