'use client';

import { useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { returnFocus } from '@/lib/tool/focus';
import type { TToolView } from '@/lib/tool/ui';
import { useTool } from '@/components/tool/context';
import { CloseButton } from '@/components/tool/kit';
import { SetupView } from '@/components/tool/views/setup';

type THostView = Exclude<TToolView, 'timer' | 'palette' | 'focus'> | 'setup';

const lazy = (load: () => Promise<{ default: ComponentType }>) => dynamic(load, { ssr: false });

const VIEWS: Record<Exclude<THostView, 'setup'>, ComponentType> = {
  faces: lazy(() => import('@/components/tool/views/faces')),
  presets: lazy(() => import('@/components/tool/views/presets')),
  history: lazy(() => import('@/components/tool/views/history')),
  clear: lazy(() => import('@/components/tool/views/clear')),
  settings: lazy(() => import('@/components/tool/views/settings')),
  devices: lazy(() => import('@/components/tool/views/devices')),
  fix: lazy(() => import('@/components/tool/views/fix')),
  share: lazy(() => import('@/components/tool/views/share')),
  extend: lazy(() => import('@/components/tool/views/extend')),
  more: lazy(() => import('@/components/tool/views/more')),
  welcome: lazy(() => import('@/components/tool/views/welcome')),
  sound: lazy(() => import('@/components/tool/views/sound')),
  studio: lazy(() => import('@/components/tool/views/studio')),
  account: lazy(() => import('@/components/tool/views/account')),
};

const SHEET_H: Record<THostView, number> = {
  setup: 0.6,
  faces: 0.72,
  presets: 0.62,
  history: 0.7,
  clear: 0.56,
  settings: 0.84,
  devices: 0.6,
  fix: 0.74,
  share: 0.7,
  extend: 0.46,
  more: 0.66,
  welcome: 0.8,
  sound: 0.74,
  studio: 0.86,
  account: 0.8,
};

export function hostViewOf(view: TToolView, sheets: boolean): THostView | null {
  if (view === 'focus') return null;
  const base = view === 'palette' ? 'timer' : view;
  if (base === 'timer') return sheets ? null : 'setup';
  return base;
}

function useTitle(view: THostView): string {
  const { m } = useTool();
  const s = m.s;
  const titles: Record<THostView, string> = {
    setup: s.session,
    faces: s.faces,
    presets: s.presets,
    history: s.history,
    clear: 'Clear history',
    settings: s.settings,
    devices: s.devices,
    fix: s.help,
    share: 'Share this setup',
    extend: 'Extend session',
    more: s.more,
    welcome: 'Welcome',
    sound: 'Ambient sound',
    studio: s.studio,
    account: 'Account',
  };
  return titles[view];
}

function Body({ view }: { view: THostView }) {
  if (view === 'setup') return <SetupView />;
  const View = VIEWS[view];
  return <View />;
}

const H2 = 'm-0 font-sans font-extrabold tracking-[-0.02em] text-foreground';

function BodyWrap({ view, children }: { view: THostView; children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-x-hidden',
        view === 'setup' ? 'gap-3' : 'gap-4',
        view === 'faces' ? 'overflow-y-auto' : 'overflow-y-auto [scrollbar-width:none]',
      )}
    >
      {children}
    </div>
  );
}

export function ToolHost({ panelTop, panelWidth }: { panelTop: number; panelWidth: number }) {
  const { device, ui, viewport, theme, a } = useTool();
  const sheets = device === 'phone' || device === 'tabletP';
  const view = hostViewOf(ui.view, sheets);
  const title = useTitle(view ?? 'setup');
  const headRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!sheets && view && view !== 'setup' && view !== 'welcome' && view !== 'clear') headRef.current?.focus();
  }, [view, sheets]);

  if (!view) return null;
  const modal = view === 'welcome' || view === 'clear';
  const close = <CloseButton label={`Close ${title}`} onClick={a.close} />;

  if (sheets) {
    return (
      <Sheet open onOpenChange={(o) => !o && a.close()}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocus();
          }}
          className={cn(
            'gap-3 rounded-t-[28px] bg-sheet pt-2.5 pb-6 shadow-e3',
            device === 'phone' ? 'px-4' : 'inset-x-[60px] px-7',
          )}
          style={{ height: Math.round(viewport.h * SHEET_H[view]), maxHeight: 'none' }}
        >
          <div className="flex shrink-0 items-center justify-between gap-3">
            <SheetTitle className={cn(H2, 'text-[22px]')}>{title}</SheetTitle>
            {close}
          </div>
          <BodyWrap view={view}>
            <Body view={view} />
          </BodyWrap>
        </SheetContent>
      </Sheet>
    );
  }

  if (modal) {
    return (
      <Dialog open onOpenChange={(o) => !o && a.close()}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          role={view === 'clear' ? 'alertdialog' : 'dialog'}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocus();
          }}
          className="top-[12vh] flex max-h-[80vh] w-[520px] max-w-[calc(100%-2rem)] flex-col gap-3.5 rounded-[28px] bg-sheet p-6 shadow-e3"
        >
          <div className="flex shrink-0 items-center justify-between gap-3">
            <DialogTitle className={cn(H2, 'text-[22px]')}>{title}</DialogTitle>
            {close}
          </div>
          <BodyWrap view={view}>
            <Body view={view} />
          </BodyWrap>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <aside
      aria-label={title}
      className={cn(
        'absolute right-0 bottom-0 z-[2] box-border flex flex-col gap-3.5 border-l border-border px-[22px] py-5',
        theme === 'oled' ? 'bg-card' : 'bg-card/80 dark:bg-card/85',
      )}
      style={{ top: panelTop, width: panelWidth }}
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h2
          ref={headRef}
          tabIndex={-1}
          className={cn(H2, 'outline-none', view === 'setup' ? 'text-[20px]' : 'text-[22px]')}
        >
          {title}
        </h2>
        {view !== 'setup' ? close : null}
      </div>
      <BodyWrap view={view}>
        <Body view={view} />
      </BodyWrap>
    </aside>
  );
}
