'use client';

import { useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Play } from 'lucide-react';
import type { TFace } from '@awaketab/core';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/format';
import { presetIdFor } from '@/lib/tool/settings';

const Face = dynamic(() => import('@/components/face').then((mod) => mod.Face), { ssr: false });

export interface IToolEmbedProps {
  face: TFace;
  totalSec: number;
  title: string;
  description: string;
  buttonLabel: string;
  eyebrow?: string;
  href?: string;
  showEnds?: boolean;
  narrow?: boolean;
  className?: string;
}

function subscribeMinute(cb: () => void) {
  const id = setInterval(cb, 15_000);
  return () => clearInterval(id);
}

const minuteNow = () => Math.floor(Date.now() / 60_000) * 60_000;

// The compact "try it here" card content pages show in their tool slot; it opens the tool ready to start.
export function ToolEmbed({
  face,
  totalSec,
  title,
  description,
  buttonLabel,
  eyebrow = 'TRY IT HERE',
  href,
  showEnds = true,
  narrow = false,
  className,
}: IToolEmbedProps) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'light' ? 'light' : resolvedTheme === 'oled' ? 'oled' : 'dark';
  const now = useSyncExternalStore(subscribeMinute, minuteNow, () => 0);
  const ends = showEnds && now && totalSec > 0 ? ` Ends at ${formatTime(now + totalSec * 1000)} if you start now.` : '';
  const link = href ?? `/?preset=${presetIdFor(totalSec)}&face=${face}&autostart=1`;
  return (
    <div
      data-slot="tool-embed"
      className={cn(
        'flex gap-6 rounded-[28px] border-2 border-lamp bg-card shadow-[0_24px_60px_color-mix(in_srgb,var(--lamp)_10%,transparent)] dark:shadow-[0_24px_60px_color-mix(in_srgb,var(--lamp)_12%,transparent)]',
        narrow
          ? 'flex-col items-stretch p-[18px]'
          : 'flex-col items-stretch p-[18px] min-[700px]:flex-row min-[700px]:items-center min-[700px]:p-7',
        className,
      )}
    >
      <span
        className="flex shrink-0 justify-center rounded-[22px] bg-background p-2.5 dark:bg-face-plate"
        aria-hidden="true"
      >
        <span className="block" style={{ width: 260, height: Math.round(260 * 0.875) }}>
          <Face
            face={face}
            theme={theme}
            state="idle"
            size={260}
            total={totalSec || 3600}
            remain={totalSec}
            indef={totalSec === 0}
            bare
          />
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-3">
        <span className="font-mono text-[12px] font-medium tracking-[.12em] text-lamp min-[700px]:text-[13px]">
          {eyebrow}
        </span>
        <strong className="text-left font-sans text-[20px] leading-[1.2] font-bold tracking-[-0.02em] min-[700px]:text-[22px]">
          {title}
        </strong>
        <span className="text-left text-[15px] leading-[1.55] text-muted-foreground-strong min-[700px]:text-[16px]">
          {description}
          {ends}
        </span>
        <Button
          asChild
          size="cta"
          className={cn(
            'h-[54px] w-full gap-2 rounded-[18px] px-5 text-[17px] font-bold shadow-[0_12px_30px_var(--primary-glow)] [&_svg]:size-5',
            !narrow && 'min-[700px]:h-15 min-[700px]:px-[26px]',
          )}
        >
          <Link href={link}>
            <Play strokeWidth={2} aria-hidden="true" />
            {buttonLabel}
          </Link>
        </Button>
      </span>
    </div>
  );
}
