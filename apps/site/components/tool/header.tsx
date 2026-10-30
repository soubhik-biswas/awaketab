'use client';

import { createLucideIcon, History } from 'lucide-react';
import { AppMark } from '@/components/brand/mark';
import { StatusPill } from '@/components/product/status-pill';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTool } from '@/components/tool/context';

// The design's menu glyph: two full lines over a short one, drawn on Lucide's grid.
export const MenuGlyph = createLucideIcon('MenuGlyph', [
  ['path', { d: 'M4 7h16', key: 'top' }],
  ['path', { d: 'M4 12h16', key: 'mid' }],
  ['path', { d: 'M4 17h10', key: 'low' }],
]);

export function ToolPill({ className }: { className?: string }) {
  const { m } = useTool();
  return (
    <StatusPill
      state={m.state}
      label={m.pillLabel}
      icon={m.state === 'ended' ? History : undefined}
      className={cn('h-9 max-w-full pr-3.5 pl-3 [&>span:first-child]:shadow-[0_0_0_4px_var(--halo)]', className)}
    />
  );
}

export function ToolHeader() {
  const { device, m, ui, a } = useTool();
  const phone = device === 'phone';
  return (
    <header
      className={cn(
        'absolute inset-x-0 top-0 z-[3] box-border flex items-center border-b border-border bg-(--tool-header) backdrop-blur-[12px]',
        phone ? 'h-14 gap-1.5 pr-2.5 pl-4' : 'h-16 gap-3 px-5',
      )}
    >
      <AppMark state={m.state} size={phone ? 28 : 32} wordSize={phone ? 19 : 21} />
      {!phone ? <ToolPill /> : null}
      <span className="flex-1" />
      <Button
        type="button"
        variant="outline"
        onClick={() => a.go('more')}
        aria-label={m.c.menu}
        aria-haspopup="dialog"
        aria-expanded={ui.view === 'more'}
        className={cn(
          'h-11 shrink-0 gap-2 rounded-[14px] border-border bg-(--tool-ghost) text-[16px] font-semibold text-foreground [&_svg]:size-5',
          phone ? 'px-3' : 'px-4',
        )}
      >
        <MenuGlyph strokeWidth={2} aria-hidden="true" />
        {!phone ? <span>{m.c.menu}</span> : null}
      </Button>
    </header>
  );
}
