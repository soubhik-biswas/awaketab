'use client';

import { motion, useReducedMotion } from 'motion/react';

// The primary button's shine: a soft white band sweeps across every 3.6 s, then rests; gone under reduced motion.
export function ShineSweep({ duration = 3.6 }: { duration?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
      <motion.span
        className="absolute inset-y-0 left-0 w-[34%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent)]"
        initial={{ x: '-120%', skewX: -18 }}
        animate={{ x: ['-120%', '320%', '320%'] }}
        transition={{ duration, times: [0, 0.6, 1], ease: [[0.6, 0, 0.2, 1], 'linear'], repeat: Infinity }}
      />
    </span>
  );
}
