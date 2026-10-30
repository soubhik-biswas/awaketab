'use client';

import Link from 'next/link';
import { BatteryWarning, ExternalLink, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTool } from '@/components/tool/context';
import { BTN_FULL, BTN_PRIMARY_FULL, H3 } from '@/components/tool/kit';

const STEPS = [
  'Plug in, or turn battery saver off for this browser.',
  'Or use the video fallback — it keeps most screens on.',
  'Still dimming? The desktop app can block system sleep.',
];

export default function FixView() {
  const { a } = useTool();
  return (
    <>
      <div className="flex items-start gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-destructive-soft text-destructive">
          <BatteryWarning className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="flex flex-col gap-1">
          <strong className={H3}>Your screen may still sleep</strong>
          <span className="text-[14px] leading-[1.5] text-muted-foreground-strong">
            Battery saver is on, and this browser ignores wake requests while it is.
          </span>
        </span>
      </div>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {STEPS.map((t, i) => (
          <li key={t} className="flex items-start gap-2.5 text-[14px] leading-[1.5]">
            <span className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-mono text-[12px] font-bold">
              {i + 1}
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      <Button type="button" onClick={a.useFallback} className={BTN_PRIMARY_FULL}>
        <Play strokeWidth={2} aria-hidden="true" />
        Use video fallback
      </Button>
      <Button asChild variant="outline" className={BTN_FULL}>
        <Link href="/guides/chrome-energy-saver">
          Open the battery guide
          <ExternalLink className="size-4" strokeWidth={2} aria-hidden="true" />
        </Link>
      </Button>
      <Button type="button" variant="ghost" onClick={a.checkAgain} className={BTN_FULL}>
        <RefreshCw className="size-4" strokeWidth={2} aria-hidden="true" />
        Check again
      </Button>
    </>
  );
}
