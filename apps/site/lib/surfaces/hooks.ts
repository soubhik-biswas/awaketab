'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import type { TFaceTheme } from '@/components/face';

export function useFaceTheme(): TFaceTheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'light' ? 'light' : resolvedTheme === 'oled' ? 'oled' : 'dark';
}

const noop = () => () => undefined;

// True only after hydration, for features the server cannot know about (Picture-in-Picture, the wake lock API).
export function useMounted(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

// A one-second clock driven by a given window's timers: the floating window keeps ticking when the tab behind it
// is hidden and the tab's own timers are throttled.
export function useWindowNow(win: Window | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const host = win ?? window;
    let id = 0;
    const tick = () => {
      setNow(Date.now());
      id = host.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    id = host.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => host.clearTimeout(id);
  }, [win]);
  return now;
}
