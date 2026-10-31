import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Bento Grid from Magic UI (magicui.design, MIT), cut down to the grid and a plain cell: the home board draws
// each cell's own art, so the library card's icon, call to action and hover lift are left out.
export function BentoGrid({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<'div'> & { children: ReactNode }) {
  return (
    <div className={cn('grid w-full grid-cols-3 gap-4', className)} {...props}>
      {children}
    </div>
  );
}

export function BentoCell({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<'div'> & { children: ReactNode }) {
  return (
    <div className={cn('group relative flex flex-col justify-between overflow-hidden', className)} {...props}>
      {children}
    </div>
  );
}
