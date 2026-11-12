'use client';

import { memo, useEffect, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { isDrawerPanel } from '@/lib/tool/ui';
import { useGlance } from '../context';

interface ILazyModule<T> {
  get: () => T | null;
  warm: () => void;
  subscribe: (cb: () => void) => () => void;
}

// Code that is fetched once, on first need. A fetch that fails (offline, a new deploy) is forgotten, so the next
// call tries again.
function lazyModule<T>(load: () => Promise<T>): ILazyModule<T> {
  let mod: T | null = null;
  let pending: Promise<void> | null = null;
  const subs = new Set<() => void>();
  return {
    get: () => mod,
    warm() {
      if (mod || pending) return;
      pending = load().then(
        (m) => {
          mod = m;
          for (const cb of subs) cb();
        },
        () => {
          pending = null;
        },
      );
    },
    subscribe(cb) {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
  };
}

const panels = lazyModule(() => import('./index'));
const palette = lazyModule(() => import('../palette'));

// The panels, the command palette and the libraries under them (the drawer, the command list) are not needed to
// start a session, so they load after the first paint: when the pointer or focus reaches a button that opens one,
// or once the browser is idle, whichever comes first.
export function warmPanels() {
  panels.warm();
  palette.warm();
}

const RETRY_MS = 3000;

function useLazy<T>(mod: ILazyModule<T>, wanted: boolean): T | null {
  const loaded = useSyncExternalStore(mod.subscribe, mod.get, () => null);
  useEffect(() => {
    if (loaded) return;
    if (wanted) {
      mod.warm();
      const id = setInterval(mod.warm, RETRY_MS);
      return () => clearInterval(id);
    }
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(mod.warm, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(mod.warm, 1500);
    return () => clearTimeout(id);
  }, [mod, loaded, wanted]);
  return loaded;
}

const SCRIM = 'absolute inset-0 z-[7] cursor-default border-0 bg-(--tg-scrim) backdrop-blur-[6px]';
const SURFACE = 'tg-glass absolute z-[8] flex flex-col overflow-hidden bg-(--tg-panel)! shadow-(--tg-shadow)';

// Stands where the panel will open, at the panel's own size, for the moment its code is still on the way. Esc or
// a tap outside closes it, as it will the panel.
function Ghost({ label, className, style }: { label: string; className: string; style?: React.CSSProperties }) {
  const g = useGlance();
  const close = g.a.close;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);
  return (
    <>
      <button type="button" tabIndex={-1} aria-label={g.t('panel.close')} onClick={close} className={SCRIM} />
      <div role="dialog" aria-label={label} aria-busy="true" className={cn(SURFACE, className)} style={style} />
    </>
  );
}

function PanelGhost() {
  const g = useGlance();
  if (g.panel === 'faces') {
    return (
      <Ghost
        label={g.t('faces.title')}
        className={g.phone ? 'inset-x-0 top-10 bottom-0 rounded-t-[28px]' : 'inset-5 rounded-[32px]'}
      />
    );
  }
  const label = g.t(`panel.${g.panel}.t`);
  if (!g.narrow) {
    return (
      <Ghost label={label} className="top-4 right-4 bottom-4 rounded-[28px]" style={{ width: g.desk ? 460 : 440 }} />
    );
  }
  const inset = g.tabP ? 24 : 0;
  return (
    <Ghost
      label={label}
      className=""
      style={{
        left: inset,
        right: inset,
        bottom: inset,
        height: Math.round(g.H * (g.phone ? 0.86 : 0.7)),
        borderRadius: g.tabP ? 32 : '28px 28px 0 0',
      }}
    />
  );
}

export const LazyPanels = memo(function LazyPanels() {
  const g = useGlance();
  const open = isDrawerPanel(g.panel) || g.panel === 'faces';
  const mod = useLazy(panels, open);
  if (mod) return <mod.Panels />;
  return open ? <PanelGhost /> : null;
});

export const LazyPalette = memo(function LazyPalette() {
  const g = useGlance();
  const open = g.panel === 'palette';
  const mod = useLazy(palette, open);
  if (mod) return <mod.Palette />;
  if (!open) return null;
  const w = Math.min(g.W - 24, 640);
  return (
    <Ghost
      label={g.t('top.searchLabel')}
      className="tg-field rounded-[24px]"
      style={{
        left: Math.round((g.W - w) / 2),
        top: g.phone ? 72 : 120,
        width: w + 2,
        height: 116 + Math.min(Math.round(window.innerHeight * 0.6), 520),
      }}
    />
  );
});
