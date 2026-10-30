'use client';

import { Check, Copy, Link as LinkIcon } from 'lucide-react';
import { faceName } from '@/components/face';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTool } from '@/components/tool/context';
import { BTN_PRIMARY_FULL, FIELD, Group, HELP } from '@/components/tool/kit';

export default function ShareView() {
  const { settings, ui, shareUrl, a } = useTool();
  const rows: Array<[string, string, boolean]> = [
    ['Length', settings.totalSec === 0 ? 'No end' : `${Math.round(settings.totalSec / 60)} min`, true],
    ['Face', faceName(settings.face), true],
    ['Chime', settings.chime !== 'off' ? 'On' : 'Off', true],
    ['Your label', 'Never shared', false],
  ];
  return (
    <>
      <span className="text-[14px] leading-[1.5] text-muted-foreground-strong">
        Send someone this exact setup. They open the link and press one button.
      </span>
      <div className={FIELD}>
        <LinkIcon className="size-4 shrink-0 text-muted-foreground-strong" strokeWidth={2} aria-hidden="true" />
        <span className="flex-1 truncate font-mono text-[13px]">{shareUrl.replace(/^https?:\/\//u, '')}</span>
      </div>
      <Button type="button" onClick={a.copyLink} className={BTN_PRIMARY_FULL}>
        <Copy strokeWidth={2} aria-hidden="true" />
        {ui.copied ? 'Copied' : 'Copy link'}
      </Button>
      <Group label="Included">
        <ul className="m-0 flex list-none flex-col p-0">
          {rows.map(([n, v, on]) => (
            <li key={n} className="flex min-h-10 items-center gap-2.5 text-[14px]">
              <span
                aria-hidden="true"
                className={cn(
                  'box-border inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] border-[1.5px] text-lamp-foreground',
                  on ? 'border-lamp bg-lamp' : 'border-input bg-transparent',
                )}
              >
                {on ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
              <span className="flex-1">
                {n}
                <span className="sr-only">{on ? ', included' : ', not included'}</span>
              </span>
              <span className={HELP}>{v}</span>
            </li>
          ))}
        </ul>
      </Group>
      <span className={HELP}>
        Labels and device names are never in the link. The preview card shows only the length and face.
      </span>
    </>
  );
}
