'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// Native checkboxes; ticks are not stored. The counter template carries {n}.
export function Checklist({ items, counter }: { items: readonly string[]; counter: string }) {
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));
  const n = done.filter(Boolean).length;
  return (
    <div className="flex max-w-[760px] flex-col gap-3">
      <span className="text-[14px] font-semibold text-muted-foreground-strong" aria-live="polite">
        {counter.replace('{n}', String(n))}
      </span>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {items.map((html, i) => (
          <li key={i}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[14px] border border-border bg-card px-4 py-3">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={done[i] ?? false}
                onChange={(e) => setDone((d) => d.map((v, k) => (k === i ? e.target.checked : v)))}
              />
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 inline-flex size-[22px] flex-none items-center justify-center rounded-[6px] border-2 border-input text-lamp-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-ring',
                  done[i] && 'border-lamp bg-lamp',
                )}
              >
                {done[i] && <Check className="size-4" strokeWidth={3} />}
              </span>
              <span className="site-prose text-[16px] leading-[1.55]" dangerouslySetInnerHTML={{ __html: html }} />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
