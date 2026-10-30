import { Play } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { TOOL_ANCHOR } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { Face } from './_pending/face';
import * as s from './styles';

export interface IToolSlotProps {
  preset: string;
  mode?: string;
  face?: string;
  minutes: number | null;
  eyebrow: string;
  title: string;
  desc: ReactNode;
  href: string;
  label: string;
  anchor?: boolean;
}

// The tool's place on a page, drawn as the content board's tool card. The tool replaces the body of this
// component; the card keeps its size so nothing shifts when it does.
export function ToolSlot({ preset, mode = 'standard', face = 'ring', minutes, eyebrow, title, desc, href, label, anchor }: IToolSlotProps) {
  const total = (minutes ?? 60) * 60;
  return (
    <div
      id={anchor ? TOOL_ANCHOR : undefined}
      data-tool-slot=""
      data-preset={preset}
      data-mode={mode}
      className={cn(
        'flex scroll-mt-6 flex-col items-stretch gap-6 rounded-[28px] border-2 border-lamp bg-card p-[18px] shadow-[0_24px_60px_var(--site-lamp-glow)] min-[700px]:flex-row min-[700px]:items-center min-[700px]:p-7',
      )}
    >
      <span className="flex flex-none justify-center rounded-[22px] bg-[var(--site-well)] p-2.5">
        <Face face={face} state="idle" size={260} total={total} remain={total} bare />
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-3">
        <span className={s.eyebrow}>{eyebrow}</span>
        <strong className={s.h3}>{title}</strong>
        <span className={cn(s.body, 'site-prose')}>{desc}</span>
        <Button asChild variant={null} size={null} className={s.btnXl}>
          <a href={href}>
            <Play className="size-5" aria-hidden="true" />
            {label}
          </a>
        </Button>
      </span>
    </div>
  );
}
