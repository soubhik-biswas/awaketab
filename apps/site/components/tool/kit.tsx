'use client';

import type { ComponentProps, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Switch as SwitchPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const EASE = [0.16, 1, 0.3, 1] as const;

export function Kbd({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 min-w-[26px] items-center justify-center rounded-[7px] border border-(--tg-border) bg-(--tg-s2) px-1.5 font-mono text-[12px] text-(--tg-t2)',
        className,
      )}
    >
      {children}
    </span>
  );
}

// Every section label keeps its 10 px top margin, the first one too, as the boards draw them.
export function SecLabel({ children }: { children: ReactNode }) {
  return <span className="mt-2.5 font-mono text-[12px] tracking-[.14em] text-(--tg-t2) uppercase">{children}</span>;
}

export function Group({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col overflow-hidden rounded-[18px] border border-(--tg-border) bg-(--tg-s1)', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export const ROW =
  'flex w-full min-h-16 items-center gap-3.5 border-0 bg-transparent px-4 py-3 text-(--tg-text) [&+&]:border-t [&+&]:border-(--tg-border)';

export function RowText({ title, desc, className }: { title: ReactNode; desc?: ReactNode; className?: string }) {
  return (
    <span className={cn('flex min-w-0 flex-1 flex-col gap-0.5 text-left', className)}>
      <strong className="text-[15px] font-semibold text-(--tg-text)">{title}</strong>
      {desc ? <span className="text-[13px] leading-[1.45] text-(--tg-t2)">{desc}</span> : null}
    </span>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <span className="mt-2 text-[13px] text-(--tg-t2)">{children}</span>;
}

export function FreeBadge({ children }: { children: ReactNode }) {
  return (
    <span className="flex-none rounded-full bg-(--tg-volt-soft) px-2.5 py-1 font-mono text-[12px] font-bold text-(--tg-free)">
      {children}
    </span>
  );
}

export const GHOST_BTN =
  'tg-btn inline-flex h-11 flex-none items-center justify-center rounded-[12px] border border-(--tg-border-hi) bg-(--tg-s2) px-4 text-[14px] font-bold text-(--tg-text)';

export const AVATAR =
  'flex size-11 flex-none items-center justify-center rounded-full border border-(--tg-border) bg-(--tg-s2) text-(--tg-t2)';

export const CARD = 'rounded-[18px] border border-(--tg-border) bg-(--tg-s1)';

export function StepNo({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-8 flex-none items-center justify-center rounded-full border border-(--tg-border-hi) bg-(--tg-s2) text-[15px] font-bold text-(--tg-text)">
      {children}
    </span>
  );
}

// A 64 px settings row that is itself the switch: the whole row toggles, the track shows the state.
export function SwitchRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: ReactNode;
  desc?: ReactNode;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <SwitchPrimitive.Root checked={checked} onCheckedChange={onChange} className={cn('tg-btn', ROW)}>
      <RowText title={title} desc={desc} />
      <span
        className={cn(
          'relative h-7 w-12 flex-none rounded-full',
          checked ? 'bg-(--tg-volt)' : 'bg-(--tg-s3) shadow-[inset_0_0_0_1px_var(--tg-border-hi)]',
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'absolute top-[3px] size-[22px] rounded-full shadow-[0_2px_6px_rgba(0,0,0,.3)] transition-[left] duration-200 ease-[cubic-bezier(.2,.9,.3,1.2)]',
            checked ? 'left-[23px] bg-(--tg-on-volt)' : 'left-[3px] bg-white dark:bg-[#F2F4FA]',
          )}
        />
      </span>
    </SwitchPrimitive.Root>
  );
}

export function Chevron({ size = 16 }: { size?: number }) {
  return (
    <ChevronRight className="flex-none" style={{ width: size, height: size }} strokeWidth={2} aria-hidden="true" />
  );
}
