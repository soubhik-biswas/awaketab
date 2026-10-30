'use client';

import { Check, CircleCheck, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { display, h3 } from '../styles';

export interface ITrackStep {
  title: string;
  text: string;
  path?: string;
}

// Fix guides: "Mark as done" per step, the next step flagged and a counter; progress is not stored.
export function TrackedSteps({
  steps,
  doneText,
  labels,
}: {
  steps: readonly ITrackStep[];
  doneText?: string;
  labels: { step: string; link: string; next: string; done: string; mark: string; count: string; clear: string };
}) {
  const [done, setDone] = useState<boolean[]>(() => steps.map(() => false));
  const n = done.filter(Boolean).length;
  const next = done.indexOf(false);
  const fill = (tpl: string, i: number) => tpl.replace('{n}', String(i + 1));
  return (
    <div className="flex max-w-[900px] flex-col gap-4">
      <span className="text-[14px] font-semibold text-muted-foreground-strong" aria-live="polite">
        {labels.count.replace('{n}', String(n)).replace('{total}', String(steps.length))}
      </span>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {steps.map((step, i) => (
          <li
            key={i}
            id={`step-${String(i + 1)}`}
            className={cn(
              'flex gap-4 rounded-[22px] border border-border bg-card p-[22px]',
              i === next && 'border-2 border-lamp',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                display,
                'inline-flex size-10 flex-none items-center justify-center rounded-full text-[20px] font-extrabold',
                done[i] ? 'bg-lamp text-lamp-foreground' : 'bg-secondary text-foreground',
              )}
            >
              {done[i] ? <Check className="size-5" strokeWidth={3} /> : i + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className={cn(h3, 'm-0')}>
                  <span className="text-muted-foreground-strong">{fill(labels.step, i)} · </span>
                  <span dangerouslySetInnerHTML={{ __html: step.title }} />
                </h3>
                <a
                  href={`#step-${String(i + 1)}`}
                  aria-label={fill(labels.link, i)}
                  className="inline-flex size-11 flex-none items-center justify-center rounded-[10px] text-muted-foreground-strong hover:bg-secondary"
                >
                  <LinkIcon className="size-4" aria-hidden="true" />
                </a>
              </div>
              {i === next && (
                <span className="font-mono text-[12px] tracking-[0.12em] text-lamp uppercase">{labels.next}</span>
              )}
              {step.path && <span className="font-mono text-[13px] text-muted-foreground-strong">{step.path}</span>}
              <p
                className="site-prose m-0 text-[16px] leading-[1.55] text-muted-foreground-strong"
                dangerouslySetInnerHTML={{ __html: step.text }}
              />
              <Button
                variant="outline"
                role="checkbox"
                aria-checked={done[i] ?? false}
                onClick={() => setDone((d) => d.map((v, k) => (k === i ? !v : v)))}
                className="w-fit gap-2 rounded-[12px] text-[15px]"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex size-5 items-center justify-center rounded-[6px] border-2 border-input',
                    done[i] && 'border-lamp bg-lamp text-lamp-foreground',
                  )}
                >
                  {done[i] && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                {done[i] ? labels.done : labels.mark}
              </Button>
            </div>
          </li>
        ))}
      </ol>
      {doneText && n === steps.length && (
        <div role="status" className="flex items-center gap-2 text-[16px] font-semibold text-lamp">
          <CircleCheck className="size-5" aria-hidden="true" />
          {doneText}
        </div>
      )}
      {n > 0 && n < steps.length && (
        <Button
          variant="link"
          onClick={() => setDone(steps.map(() => false))}
          className="w-fit px-1 text-[15px] font-bold underline-offset-[3px]"
        >
          {labels.clear}
        </Button>
      )}
    </div>
  );
}
