'use client';

import { useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const CALM = '(prefers-reduced-motion: no-preference)';

// The board's pop: scale from 92 % and fade in over 240 ms with a slight overshoot; reduced motion shows it at once.
export function usePop<T extends HTMLElement>(key?: unknown): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(CALM, () => {
        gsap.fromTo(
          el,
          { scale: 0.92, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.24, ease: 'back.out(1.6)', clearProps: 'transform,opacity' },
        );
      });
      return () => mm.revert();
    },
    { dependencies: [key] },
  );
  return ref;
}

// A hold that fills over `ms`: progress runs 0 → 1 while held and snaps back when let go. It is the control's
// feedback, not decoration, so it runs under reduced motion too.
export function holdTween(ms: number, onProgress: (p: number) => void, onDone: () => void): () => void {
  const state = { p: 0 };
  const tween = gsap.to(state, {
    p: 1,
    duration: ms / 1000,
    ease: 'none',
    onUpdate: () => onProgress(state.p),
    onComplete: onDone,
  });
  return () => {
    tween.kill();
    onProgress(0);
  };
}
