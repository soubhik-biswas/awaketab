'use client';

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
import { useIsClient } from 'usehooks-ts';
import { cn } from '@/lib/utils';

type TChoice = 'system' | 'light' | 'dark';

const CHOICES: ReadonlyArray<readonly [TChoice, LucideIcon]> = [
  ['system', Monitor],
  ['light', Sun],
  ['dark', Moon],
];

// The footer's System / Light / Dark switch. OLED counts as Dark here; the four-card choice lives in the tool's
// Settings. Before mount nothing is marked, so the server never guesses the visitor's theme.
export function FooterTheme({ label, names }: { label: string; names: Record<TChoice, string> }) {
  const { theme, setTheme } = useTheme();
  const mounted = useIsClient();
  const reduced = useReducedMotion();
  const current: TChoice | null = !mounted
    ? null
    : theme === 'light'
      ? 'light'
      : theme === 'system'
        ? 'system'
        : 'dark';
  return (
    <span
      role="radiogroup"
      aria-label={label}
      className="inline-flex gap-0.5 rounded-full border border-white/[.09] bg-white/5 p-[3px]"
    >
      {CHOICES.map(([value, Icon]) => {
        const on = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={names[value]}
            onClick={() => setTheme(value)}
            className={cn(
              'relative inline-flex h-7 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent outline-none after:absolute after:-inset-x-1.5 after:-inset-y-2 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7CBBFF]',
              on ? 'text-[#05060A]' : 'text-[#A6AFC2] hover:text-[#F2F4FA]',
            )}
          >
            {on && (
              <motion.span
                layoutId="site-foot-theme"
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-[#F2F4FA]"
                transition={reduced ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            <Icon className="relative size-3.5" strokeWidth={2} aria-hidden="true" />
          </button>
        );
      })}
    </span>
  );
}
