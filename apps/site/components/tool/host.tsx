'use client';

import { useCallback, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { fill } from '@/lib/tool/chrome';
import { returnFocus } from '@/lib/tool/focus';
import { DEVICE_SIZES } from '@/lib/tool/model';
import type { TToolView } from '@/lib/tool/ui';
import { useTool } from '@/components/tool/context';
import { CloseButton } from '@/components/tool/kit';
import { arriveEl } from '@/components/tool/motion';

type THostView = Exclude<TToolView, 'timer' | 'palette' | 'focus'>;

const lazy = (load: () => Promise<{ default: ComponentType }>) => dynamic(load, { ssr: false });

const VIEWS: Record<THostView, ComponentType> = {
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

// Share of the viewport height each sheet takes.
const SHEET_H: Record<THostView, number> = {
  faces: 0.8,
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

function hostViewOf(view: TToolView): THostView | null {
  return view === 'timer' || view === 'palette' || view === 'focus' ? null : view;
}

function useTitle(view: THostView): string {
  const { m } = useTool();
  const { s, c } = m;
  const titles: Record<THostView, string> = {
    faces: s.faces,
    presets: s.presets,
    history: s.history,
    clear: c.clearTitle,
    settings: s.settings,
    devices: s.devices,
    fix: s.help,
    share: c.share,
    extend: c.extendTitle,
    more: c.menu,
    welcome: c.welcome,
    sound: c.ambient,
    studio: s.studio,
    account: c.account,
  };
  return titles[view];
}

const TITLE = 'm-0 font-display leading-[1.1] font-extrabold tracking-[-0.025em] text-foreground [font-stretch:112%]';

function Body({ view }: { view: THostView }) {
  const View = VIEWS[view];
  return (
    <div
      className={cn(
        '-m-2 box-border flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-2',
        view === 'more' ? 'gap-0' : 'gap-4',
        view !== 'faces' && view !== 'more' && '[scrollbar-width:none]',
      )}
    >
      <View />
    </div>
  );
}

function Head({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { m } = useTool();
  return (
    <div className="flex shrink-0 items-center justify-between gap-3">
      {children}
      <CloseButton label={fill(m.c.close, { title })} onClick={onClose} />
    </div>
  );
}

const NO_RISE = 'data-[state=open]:animate-none';

export function ToolHost() {
  const { device, ui, viewport, a } = useTool();
  const phone = device === 'phone';
  const view = hostViewOf(ui.view);
  const title = useTitle(view ?? 'more');
  const arrive = useCallback((el: HTMLElement | null) => {
    if (el) arriveEl(el);
  }, []);
  if (!view) return null;

  const onOpenChange = (open: boolean) => {
    if (!open) a.close();
  };
  const onCloseAutoFocus = (e: Event) => {
    e.preventDefault();
    returnFocus();
  };

  if (phone) {
    return (
      <Drawer open onOpenChange={onOpenChange}>
        <DrawerContent
          aria-describedby={undefined}
          onCloseAutoFocus={onCloseAutoFocus}
          className="gap-3"
          style={{ height: Math.round(viewport.h * SHEET_H[view]) }}
        >
          <Head title={title} onClose={a.close}>
            <DrawerTitle className={cn(TITLE, 'text-[24px]')}>{title}</DrawerTitle>
          </Head>
          <Body view={view} />
        </DrawerContent>
      </Drawer>
    );
  }

  const { top, bar } = DEVICE_SIZES[device];
  const modal = view === 'welcome' || view === 'clear';
  const sheetW = Math.min(viewport.w - 48, view === 'faces' ? 860 : 600);
  const box =
    view === 'more'
      ? 'top-(--host-top) right-4 left-auto max-h-(--host-max) w-[400px] max-w-[calc(100%-32px)] translate-x-0 gap-2 rounded-[24px] border border-border px-5 pt-2.5 pb-4'
      : modal
        ? 'gap-3.5'
        : 'top-auto bottom-(--host-bottom) h-(--host-h) max-h-none w-(--host-w) max-w-none gap-3 rounded-[28px] border border-border px-7 pt-2.5 pb-6';
  const vars = {
    '--host-top': `${top + 8}px`,
    '--host-max': `${viewport.h - top - 24}px`,
    '--host-bottom': `${bar + 8}px`,
    '--host-w': `${sheetW}px`,
    '--host-h': `${Math.min(Math.round(viewport.h * SHEET_H[view]), viewport.h - top - bar - 32)}px`,
  } as CSSProperties;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        ref={arrive}
        showCloseButton={false}
        aria-describedby={undefined}
        role={view === 'clear' ? 'alertdialog' : 'dialog'}
        onCloseAutoFocus={onCloseAutoFocus}
        className={cn('overflow-hidden', NO_RISE, box)}
        style={vars}
      >
        <Head title={title} onClose={a.close}>
          <DialogTitle className={cn(TITLE, 'text-[28px]')}>{title}</DialogTitle>
        </Head>
        <Body view={view} />
      </DialogContent>
    </Dialog>
  );
}
