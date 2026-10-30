'use client';

import Link from 'next/link';
import {
  Ellipsis,
  History,
  Laptop,
  LayoutGrid,
  LifeBuoy,
  ListChecks,
  Palette,
  Puzzle,
  Settings,
  Timer,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MORE_VIEWS, type TToolView } from '@/lib/tool/ui';
import { useTool } from '@/components/tool/context';
import { PRO_CHIP } from '@/components/tool/kit';

type TNavItem = { view: TToolView; label: string; icon: LucideIcon; pro?: boolean };

function isCurrent(view: TToolView, base: TToolView): boolean {
  return base === view || (view === 'history' && base === 'clear');
}

function baseView(view: TToolView): TToolView {
  return view === 'palette' || view === 'focus' ? 'timer' : view;
}

export function SideNav() {
  const { device, ui, m, a } = useTool();
  const rail = device === 'tabletL';
  const s = m.s;
  const base = baseView(ui.view);
  const items: TNavItem[] = [
    { view: 'timer', label: s.timer, icon: Timer },
    { view: 'faces', label: s.faces, icon: LayoutGrid },
    { view: 'presets', label: s.presets, icon: ListChecks },
    { view: 'history', label: s.history, icon: History },
    { view: 'studio', label: rail && m.lang === 'en' ? 'Studio' : s.studio, icon: Palette, pro: true },
    { view: 'sound', label: s.soundNav, icon: Volume2, pro: true },
    { view: 'devices', label: s.devices, icon: Laptop, pro: true },
    { view: 'settings', label: s.settings, icon: Settings },
    { view: 'fix', label: s.help, icon: LifeBuoy },
  ];
  return (
    <nav
      aria-label="Main"
      className={cn(
        'absolute bottom-0 left-0 z-[2] box-border flex flex-col gap-1 border-r border-border bg-card/55 dark:bg-card/60',
        rail ? 'top-16 w-[84px] items-center px-2 py-3' : 'top-16 w-[232px] items-stretch px-3 py-4',
      )}
    >
      {items.map((n) => {
        const on = isCurrent(n.view, base);
        const Icon = n.icon;
        return (
          <button
            key={n.view}
            type="button"
            onClick={() => a.go(n.view)}
            aria-current={on ? 'page' : undefined}
            aria-label={n.label}
            className={cn(
              'cursor-pointer border-0 transition-colors duration-glide ease-glide',
              rail
                ? 'flex min-h-[60px] w-[68px] flex-col items-center justify-center gap-1 rounded-[14px] py-1.5'
                : 'box-border flex h-11 w-full items-center gap-3 rounded-[12px] px-3 text-[15px]',
              on ? 'bg-accent text-lamp' : cn('bg-transparent hover:bg-secondary', rail ? 'text-muted-foreground-strong' : 'text-foreground'),
              !rail && (on ? 'font-bold' : 'font-medium'),
            )}
          >
            <Icon className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span
              className={cn(
                'truncate',
                rail ? cn('max-w-[68px] text-center text-[12px]', on ? 'font-bold' : 'font-medium') : 'flex-1 text-left',
              )}
            >
              {n.label}
            </span>
            {n.pro && !rail ? <span className={PRO_CHIP}>Pro</span> : null}
          </button>
        );
      })}
      {device === 'desktop' ? (
        <div className="mt-auto flex flex-col gap-2 rounded-[16px] border border-border bg-card p-3.5">
          <span className="flex items-center gap-2 text-[14px] font-bold">
            <Puzzle className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
            Get the extension
          </span>
          <span className="text-[13px] leading-[1.45] text-muted-foreground-strong">
            Keep any tab awake from the toolbar — no new window needed.
          </span>
          <Button
            asChild
            className="h-11 rounded-[10px] border-foreground bg-foreground px-4 text-[14px] font-semibold text-background hover:border-foreground hover:bg-foreground/90"
          >
            <Link href="/extension">Add to browser</Link>
          </Button>
        </div>
      ) : null}
    </nav>
  );
}

export function BottomNav() {
  const { ui, m, a, theme } = useTool();
  const s = m.s;
  const base = baseView(ui.view);
  const items: TNavItem[] = [
    { view: 'timer', label: s.timer, icon: Timer },
    { view: 'faces', label: s.faces, icon: LayoutGrid },
    { view: 'presets', label: s.presets, icon: ListChecks },
    { view: 'history', label: s.history, icon: History },
    { view: 'more', label: s.more, icon: Ellipsis },
  ];
  return (
    <nav
      aria-label="Main"
      className={cn(
        'absolute inset-x-0 bottom-0 z-[4] box-border flex h-[76px] border-t border-border px-1.5 pt-1 pb-3 backdrop-blur-[12px]',
        theme === 'oled' ? 'bg-background' : 'bg-card/92',
      )}
    >
      {items.map((n) => {
        const on = isCurrent(n.view, base) || (n.view === 'more' && MORE_VIEWS.includes(base));
        const Icon = n.icon;
        return (
          <button
            key={n.view}
            type="button"
            onClick={() => a.go(n.view)}
            aria-current={on ? 'page' : undefined}
            aria-label={n.label}
            className={cn(
              'flex min-h-[60px] flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 border-0 bg-transparent',
              on ? 'text-lamp' : 'text-muted-foreground-strong',
            )}
          >
            <span
              className={cn(
                'inline-flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-fast ease-glide',
                on ? 'bg-accent' : 'bg-transparent',
              )}
            >
              <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className={cn('max-w-[72px] truncate text-[12px]', on ? 'font-bold' : 'font-medium')}>
              {n.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
