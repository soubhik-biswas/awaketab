import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const subscribe = (onChange: () => void): (() => void) => {
  if (typeof window === 'undefined' || !('matchMedia' in window)) return () => undefined;
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => {
    mq.removeEventListener('change', onChange);
  };
};

const read = (): boolean => typeof window !== 'undefined' && 'matchMedia' in window && window.matchMedia(QUERY).matches;

// The system's reduced-motion setting, live; the server and the first paint assume motion (CSS stills it anyway).
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
