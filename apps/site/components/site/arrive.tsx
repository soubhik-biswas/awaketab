'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

gsap.registerPlugin(useGSAP);

// The hero art's arrival: it rises in once over the arrive duration. Reduced motion shows it at rest; site.css
// reveals it on its own if the script never runs.
export function Arrive({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          ref.current,
          { opacity: 0, y: 16, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.52, delay: 0.06, ease: 'expo.out', clearProps: 'transform' },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={cn('site-arrive', className)}>
      {children}
    </div>
  );
}
