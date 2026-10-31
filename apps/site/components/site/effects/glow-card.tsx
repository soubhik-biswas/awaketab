'use client';

import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react';
import type { PointerEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// The spotlight of Magic UI's Magic Card (magicui.design, MIT), gradient mode only: a soft light follows the
// pointer over a card that keeps its own surface. Touch and reduced motion get the card without it.
export function GlowCard({
  href,
  children,
  className,
  color,
  size = 260,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  color: string;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const x = useMotionValue(-size);
  const y = useMotionValue(-size);
  const light = useMotionTemplate`radial-gradient(${size}px circle at ${x}px ${y}px, ${color}, transparent 100%)`;
  const move = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== 'mouse') return;
    const box = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - box.left);
    y.set(e.clientY - box.top);
  };
  const leave = () => {
    x.set(-size);
    y.set(-size);
  };
  return (
    <a href={href} onPointerMove={move} onPointerLeave={leave} className={cn('group', className)}>
      {!reduced && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: light }}
        />
      )}
      {children}
    </a>
  );
}
