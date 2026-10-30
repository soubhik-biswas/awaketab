'use client';

import Link from 'next/link';
import { Contrast, Moon, Search, Sparkles, Sun } from 'lucide-react';
import { AppMark } from '@/components/brand/mark';
import { StatusPill } from '@/components/product/status-pill';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import { useTool } from '@/components/tool/context';
import { KBD } from '@/components/tool/kit';

const ICON_BTN = 'size-11 shrink-0 rounded-[12px] p-0 text-foreground [&_svg]:size-5';
const THEME_NAME = { light: 'light', dark: 'dark', oled: 'OLED black' } as const;

export function ToolPill({ className }: { className?: string }) {
  const { m } = useTool();
  return <StatusPill state={m.state} label={m.pillLabel} className={cn('h-9 pr-3.5 pl-3', className)} />;
}

export function ToolHeader() {
  const { device, theme, m, a } = useTool();
  const phone = device === 'phone';
  const wide = device === 'desktop' || device === 'tabletL';
  const ThemeIcon = theme === 'light' ? Sun : theme === 'oled' ? Contrast : Moon;
  return (
    <header
      className={cn(
        'absolute inset-x-0 top-0 z-[3] box-border flex items-center border-b border-border bg-background/70 backdrop-blur-[12px] dark:bg-background/55',
        phone ? 'h-14 gap-1.5 pr-2.5 pl-4' : 'h-16 gap-3 px-5',
      )}
    >
      <span className="flex shrink-0 items-center">
        <AppMark state={m.state} size={phone ? 28 : 32} wordSize={phone ? 19 : 21} />
      </span>
      {!phone ? <ToolPill /> : null}
      <span className="flex-1" />
      {wide ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => a.go('palette')}
          aria-label="Open command palette"
          aria-keyshortcuts="Meta+K Control+K"
          className={cn(
            'h-11 shrink-0 justify-start gap-2 rounded-[12px] border-border pr-2.5 pl-3 text-[14px] font-medium text-muted-foreground-strong [&_svg]:size-[18px]',
            device === 'desktop' ? 'w-[340px]' : 'w-[260px]',
          )}
        >
          <Search strokeWidth={2} aria-hidden="true" />
          <span className="flex-1 text-left">{m.s.search}</span>
          <Kbd className={KBD}>⌘K</Kbd>
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          onClick={() => a.go('palette')}
          aria-label="Search and commands"
          className={ICON_BTN}
        >
          <Search strokeWidth={1.75} aria-hidden="true" />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        onClick={a.cycleTheme}
        aria-label={`Theme: ${THEME_NAME[theme]}. Switch theme`}
        aria-keyshortcuts="Shift+D"
        className={ICON_BTN}
      >
        <ThemeIcon strokeWidth={1.75} aria-hidden="true" />
      </Button>
      {!phone ? (
        <Button
          asChild
          variant="secondary"
          className="h-11 shrink-0 gap-2 rounded-full border-primary-soft bg-primary-soft px-4 text-[14px] font-semibold text-primary hover:border-primary-soft hover:bg-primary-soft [&_svg]:size-4"
        >
          <Link href="/pro">
            <Sparkles strokeWidth={2} aria-hidden="true" />
            Pro
          </Link>
        </Button>
      ) : null}
    </header>
  );
}
