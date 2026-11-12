'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { useResizeObserver } from 'usehooks-ts';
import screenfull from 'screenfull';
import { STAGE_ID } from '@/lib/tool/stage-id';
import { wake, type IWakeSnapshot } from '@/lib/wake';

const IDLE_MS = 5000;
const ACTIVITY = ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'] as const;
const POINTER_FOCUS_MS = 700;

interface IIdleOptions {
  root: HTMLElement | null;
  // With reduced motion asked for, keyboard focus anywhere in the tool keeps the controls.
  steady: boolean;
}

// Focus the keyboard or assistive technology put there. A click also focuses its button, and must not pin the
// controls, so focus that follows a pointer press within a moment is the pointer's until a key is used.
function keepsControls(root: HTMLElement | null, steady: boolean, byPointer: boolean): boolean {
  const el = document.activeElement;
  if (byPointer || !root || !(el instanceof HTMLElement) || !root.contains(el)) return false;
  return steady || el.closest('[data-rests]') !== null;
}

// While awake with no panel open, the controls rest after 5 s without a pointer move, touch, key or a focus move
// inside the tool. They never rest while focus is on them, so a keyboard or screen reader is not thrown off a button.
export function useIdle(
  active: boolean,
  { root, steady }: IIdleOptions,
): { idle: boolean; wake: () => void; rest: () => void } {
  const [idle, setIdle] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resting = useRef(false);
  const press = useRef(0);
  const byPointer = useRef(false);
  const settle = useCallback((on: boolean) => {
    resting.current = on;
    setIdle(on);
  }, []);
  const arm = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (keepsControls(root, steady, byPointer.current)) arm();
      else settle(true);
    }, IDLE_MS);
  }, [root, steady, settle]);
  const wakeUp = useCallback(() => {
    settle(false);
    if (active) arm();
  }, [active, arm, settle]);
  useEffect(() => {
    if (!active) {
      if (timer.current) clearTimeout(timer.current);
      settle(false);
      return;
    }
    arm();
    const onAct = (e: Event) => {
      if (e.type === 'pointerdown' || e.type === 'touchstart') press.current = Date.now();
      if (e.type === 'keydown') byPointer.current = false;
      settle(false);
      arm();
    };
    const onFocus = (e: FocusEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || !root?.contains(el)) return;
      // The stage takes focus when the controls rest; that move is the tool's own, not the person's.
      if (el.id === STAGE_ID && resting.current) return;
      byPointer.current = Date.now() - press.current < POINTER_FOCUS_MS;
      settle(false);
      arm();
    };
    for (const ev of ACTIVITY) window.addEventListener(ev, onAct, { passive: true });
    window.addEventListener('focusin', onFocus);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      for (const ev of ACTIVITY) window.removeEventListener(ev, onAct);
      window.removeEventListener('focusin', onFocus);
    };
  }, [active, arm, root, settle]);
  const rest = useCallback(() => {
    if (!active) return;
    if (keepsControls(root, steady, byPointer.current)) arm();
    else {
      if (timer.current) clearTimeout(timer.current);
      settle(true);
    }
  }, [active, arm, root, steady, settle]);
  return { idle: active && idle, wake: wakeUp, rest };
}

// One value read from the wake engine: the caller is drawn again only when that value changes, not every second.
export function useWakeValue<T extends string | number | boolean | null>(select: (snap: IWakeSnapshot) => T): T {
  return useSyncExternalStore(
    wake.subscribe,
    () => select(wake.getSnapshot()),
    () => select(wake.getServerSnapshot()),
  );
}

export type TWakeStill = Omit<IWakeSnapshot, 'now'>;

let still: IWakeSnapshot | null = null;

function readStill(): IWakeSnapshot {
  const snap = wake.getSnapshot();
  const keys = Object.keys(snap) as Array<keyof IWakeSnapshot>;
  const prev = still;
  if (!prev || keys.length !== Object.keys(prev).length || keys.some((k) => k !== 'now' && prev[k] !== snap[k]))
    still = snap;
  return still ?? snap;
}

// The session without its running clock: it changes when something happens, not with each second.
export function useWakeStill(): TWakeStill {
  return useSyncExternalStore(wake.subscribe, readStill, wake.getServerSnapshot);
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

const never = () => () => undefined;

// The real Fullscreen API on the tool itself (screenfull smooths the vendor differences). `can` is false where the
// browser has none (an iPhone), so the button is not offered there.
export function useFullscreen(): { on: boolean; can: boolean; toggle: (el: HTMLElement | null) => boolean } {
  const [on, setOn] = useState(false);
  const can = useSyncExternalStore(
    never,
    () => screenfull.isEnabled,
    () => false,
  );
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
  return { on, can, toggle };
}

// The tool's own size, so its layout follows the frame it sits in (the home page, the dev frame, fullscreen).
export function useFrame(ref: RefObject<HTMLDivElement | null>): { w: number; h: number } | null {
  const { width, height } = useResizeObserver({ ref: ref as RefObject<HTMLDivElement>, box: 'border-box' });
  if (!width || !height) return null;
  return { w: Math.round(width), h: Math.round(height) };
}
