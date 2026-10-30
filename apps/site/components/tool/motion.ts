'use client';

import type { RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const CALM = '(prefers-reduced-motion: no-preference)';

// The panel spring for sheets, the menu and the bar; reduced motion shows them at once.
export function useArrive(
  ref: RefObject<HTMLElement | null>,
  {
    y = 16,
    duration = 0.24,
    ease = 'back.out(1.4)',
    key,
  }: { y?: number; duration?: number; ease?: string; key?: unknown } = {},
) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(CALM, () => {
        gsap.fromTo(el, { y, opacity: 0 }, { y: 0, opacity: 1, duration, ease, clearProps: 'transform,opacity' });
      });
      return () => mm.revert();
    },
    { dependencies: [key], scope: ref },
  );
}

// The lamp lights: the room glow brightens over the arrive duration when a session becomes awake.
export function useLampLight(ref: RefObject<HTMLElement | null>, awake: boolean) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(CALM, () => {
        gsap.fromTo(el, { opacity: 0.35 }, { opacity: 1, duration: 0.52, ease: 'expo.out', clearProps: 'opacity' });
      });
      return () => mm.revert();
    },
    { dependencies: [awake], scope: ref },
  );
}

// One-shot arrival for content that mounts inside a portal, where a hook on the owner would run too early.
export function arriveEl(el: HTMLElement, { y = 16, duration = 0.24, ease = 'back.out(1.4)' } = {}) {
  if (typeof window === 'undefined' || !window.matchMedia(CALM).matches) return;
  gsap.fromTo(el, { y, opacity: 0 }, { y: 0, opacity: 1, duration, ease, clearProps: 'transform,opacity' });
}
