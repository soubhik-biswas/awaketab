'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useResizeObserver } from 'usehooks-ts';
import screenfull from 'screenfull';

const IDLE_MS = 5000;
const ACTIVITY = ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'] as const;

// While awake with no panel open, the controls rest after 5 s without a pointer move, touch or key.
export function useIdle(active: boolean): { idle: boolean; wake: () => void; rest: () => void } {
  const [idle, setIdle] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arm = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setIdle(true), IDLE_MS);
  }, []);
  const wake = useCallback(() => {
    setIdle(false);
    if (active) arm();
  }, [active, arm]);
  useEffect(() => {
    if (!active) {
      if (timer.current) clearTimeout(timer.current);
      setIdle(false);
      return;
    }
    arm();
    const onAct = () => {
      setIdle(false);
      arm();
    };
    for (const ev of ACTIVITY) window.addEventListener(ev, onAct, { passive: true });
    return () => {
      if (timer.current) clearTimeout(timer.current);
      for (const ev of ACTIVITY) window.removeEventListener(ev, onAct);
    };
  }, [active, arm]);
  const rest = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (active) setIdle(true);
  }, [active]);
  return { idle: active && idle, wake, rest };
}

interface IBattery {
  charging: boolean;
  level: number;
  addEventListener: (type: string, cb: () => void) => void;
  removeEventListener: (type: string, cb: () => void) => void;
}

// Browsers do not report battery saver itself; a low battery that is not charging is when it switches on, so the
// living backgrounds rest then too.
export function useLowBattery(): boolean {
  const [low, setLow] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<IBattery> };
    if (!nav.getBattery) return;
    let battery: IBattery | null = null;
    const read = () => setLow(battery !== null && !battery.charging && battery.level <= 0.2);
    void nav
      .getBattery()
      .then((b) => {
        battery = b;
        read();
        b.addEventListener('levelchange', read);
        b.addEventListener('chargingchange', read);
      })
      .catch(() => undefined);
    return () => {
      battery?.removeEventListener('levelchange', read);
      battery?.removeEventListener('chargingchange', read);
    };
  }, []);
  return low;
}

// The real Fullscreen API on the tool itself (screenfull smooths the vendor differences).
export function useFullscreen(): { on: boolean; toggle: (el: HTMLElement | null) => boolean } {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!screenfull.isEnabled) return;
    const onChange = () => setOn(screenfull.isFullscreen);
    screenfull.on('change', onChange);
    return () => screenfull.off('change', onChange);
  }, []);
  const toggle = useCallback((el: HTMLElement | null) => {
    if (!screenfull.isEnabled || !el) return false;
    if (screenfull.isFullscreen) void screenfull.exit().catch(() => undefined);
    else void screenfull.request(el).catch(() => undefined);
    return true;
  }, []);
  return { on, toggle };
}

// The tool's own size, so its layout follows the frame it sits in (the home page, the dev frame, fullscreen).
export function useFrame(ref: RefObject<HTMLDivElement | null>): { w: number; h: number } | null {
  const { width, height } = useResizeObserver({ ref: ref as RefObject<HTMLDivElement>, box: 'border-box' });
  if (!width || !height) return null;
  return { w: Math.round(width), h: Math.round(height) };
}
