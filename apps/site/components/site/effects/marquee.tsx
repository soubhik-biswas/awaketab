import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Marquee from Magic UI (magicui.design, MIT). The keyframes live in site.css as site-marquee; the global
// reduced-motion rule stops them, leaving the first copy at rest.
interface IMarqueeProps extends ComponentPropsWithoutRef<'div'> {
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: ReactNode;
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  repeat = 4,
  ...props
}: IMarqueeProps) {
  return (
    <div
      {...props}
      className={cn('group flex flex-row gap-(--gap) overflow-hidden [--duration:40s] [--gap:1rem]', className)}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 || undefined}
          className={cn(
            'site-marquee-track flex shrink-0 flex-row justify-around gap-(--gap)',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
            reverse && '[animation-direction:reverse]',
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
