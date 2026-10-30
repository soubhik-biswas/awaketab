import { useSyncExternalStore } from 'react';
import type { TDevice } from '@/lib/tool/ui';

// The four drawn layouts by viewport width: phone, tablet portrait, tablet landscape (icon rail), desktop.
export const DEVICE_QUERIES: ReadonlyArray<[TDevice, string]> = [
  ['desktop', '(min-width: 1280px)'],
  ['tabletL', '(min-width: 1024px)'],
  ['tabletP', '(min-width: 700px)'],
];

function current(): TDevice {
  for (const [device, q] of DEVICE_QUERIES) if (window.matchMedia(q).matches) return device;
  return 'phone';
}

function subscribe(cb: () => void) {
  const lists = DEVICE_QUERIES.map(([, q]) => window.matchMedia(q));
  for (const l of lists) l.addEventListener('change', cb);
  return () => {
    for (const l of lists) l.removeEventListener('change', cb);
  };
}

export function useDevice(): TDevice {
  return useSyncExternalStore(subscribe, current, () => 'desktop');
}

export interface IViewport {
  w: number;
  h: number;
}

let size: IViewport = { w: 1440, h: 900 };

function readSize(): IViewport {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w !== size.w || h !== size.h) size = { w, h };
  return size;
}

function subscribeSize(cb: () => void) {
  window.addEventListener('resize', cb);
  return () => {
    window.removeEventListener('resize', cb);
  };
}

export function useViewport(): IViewport {
  return useSyncExternalStore(subscribeSize, readSize, () => size);
}
