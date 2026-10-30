'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/product/toasts';
import { MiniClock } from '@/components/pip/mini-clock';
import type { TLocale } from '@/i18n/locales';
import { cn } from '@/lib/utils';
import { useToolSettings } from '@/lib/tool/settings';
import { useFaceTheme, useMounted, useWindowNow } from '@/lib/surfaces/hooks';
import { hostMirror } from '@/lib/surfaces/mirror';
import { holdOwnLock, type TOwnLock } from '@/lib/surfaces/own-lock';
import { dressWindow, openDocumentPip, openPopup, pipSupport } from '@/lib/surfaces/pip';
import { EXTEND_SEC, surfaceView } from '@/lib/surfaces/session';
import { isLive, useWake, wake } from '@/lib/wake';

type TPipOpen = { kind: 'document'; win: Window } | { kind: 'popup'; win: Window } | null;

// Esc or Space stops the session and P closes the window, as in the tool's keyboard map.
export function pipKeys(win: Window, stop: () => void, close: () => void): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const onButton = e.target instanceof HTMLElement && e.target.closest('button') !== null;
    if (e.key === 'p' || e.key === 'P') close();
    else if (e.key === 'Escape' || (e.key === ' ' && !onButton)) {
      e.preventDefault();
      stop();
    }
  };
  win.addEventListener('keydown', onKey);
  return () => win.removeEventListener('keydown', onKey);
}

export function useOwnLock(win: Window | null, wanted: boolean): boolean {
  const [own, setOwn] = useState<TOwnLock>('off');
  useEffect(() => {
    if (!win || !wanted) return;
    return holdOwnLock(win, setOwn);
  }, [win, wanted]);
  return wanted && own === 'held';
}

// The mini clock inside the floating window: the tool's own session, with a wake lock held by that window.
function FloatingClock({ win, onClose }: { win: Window; onClose: () => void }) {
  const snap = useWake();
  const now = useWindowNow(win);
  const locale = useLocale();
  const { h12 } = useToolSettings();
  const theme = useFaceTheme();
  const held = useOwnLock(win, isLive(snap.state) && snap.pausedAt === null);
  const view = surfaceView({ ...snap, now }, { held, locale, fmt: h12 ? 12 : 24 });
  useEffect(() => pipKeys(win, () => wake.stop(), onClose), [win, onClose]);
  return <MiniClock view={view} theme={theme} windowed onExtend={() => wake.extend(EXTEND_SEC)} onClose={onClose} />;
}

// Any part of the tool can open the mini clock by dispatching this event on window.
export const PIP_EVENT = 'awaketab:pip';

export interface IPipLauncherProps {
  className?: string;
  style?: CSSProperties;
  label?: string;
  hideButton?: boolean;
}

// "Pop out mini clock": Document Picture-in-Picture where the browser has it, else the /pip popup that mirrors this
// tab over BroadcastChannel; hidden, not disabled, where neither works.
export function PipLauncher({ className, style, label, hideButton = false }: IPipLauncherProps) {
  const t = useTranslations('surfaces.pip');
  const locale = useLocale() as TLocale;
  const mounted = useMounted();
  const [open, setOpen] = useState<TPipOpen>(null);
  const current = useRef<TPipOpen>(null);
  const undress = useRef<(() => void) | null>(null);
  const support = mounted ? pipSupport() : 'none';

  useEffect(() => {
    current.current = open;
  }, [open]);

  const close = useCallback(() => {
    const cur = current.current;
    if (cur && !cur.win.closed) cur.win.close();
    setOpen(null);
  }, []);

  useEffect(() => {
    if (open?.kind !== 'popup') return;
    const stopHost = hostMirror(wake.getSnapshot, wake.subscribe, {
      extend: (sec) => wake.extend(sec),
      stop: () => wake.stop(),
    });
    const id = setInterval(() => {
      if (open.win.closed) setOpen(null);
    }, 1000);
    return () => {
      stopHost();
      clearInterval(id);
    };
  }, [open]);

  useEffect(() => {
    if (open?.kind !== 'document') return;
    const win = open.win;
    const onHide = () => {
      undress.current?.();
      undress.current = null;
      setOpen(null);
    };
    win.addEventListener('pagehide', onHide);
    return () => win.removeEventListener('pagehide', onHide);
  }, [open]);

  useEffect(() => () => undress.current?.(), []);

  const popRef = useRef<() => Promise<void>>(() => Promise.resolve());
  useEffect(() => {
    const onAsk = () => void popRef.current();
    window.addEventListener(PIP_EVENT, onAsk);
    return () => window.removeEventListener(PIP_EVENT, onAsk);
  }, []);

  const pop = async () => {
    if (support === 'document') {
      const win = await openDocumentPip();
      if (win) {
        undress.current?.();
        undress.current = dressWindow(win);
        win.document.title = t('title');
        setOpen({ kind: 'document', win });
        return;
      }
    }
    const win = openPopup(locale);
    if (win) setOpen({ kind: 'popup', win });
    else showToast({ id: 'pip-blocked', tone: 'error', title: t('popupBlocked') });
  };
  popRef.current = pop;

  if (support === 'none') return null;
  return (
    <>
      {open || hideButton ? null : (
        <Button
          style={style}
          type="button"
          size="lg"
          className={cn(
            'h-13 rounded-[14px] px-[18px] text-[16px] font-bold shadow-[0_12px_30px_var(--primary-glow)]',
            className,
          )}
          onClick={() => void pop()}
        >
          {label ?? t('open')}
        </Button>
      )}
      {open?.kind === 'document'
        ? createPortal(<FloatingClock win={open.win} onClose={close} />, open.win.document.body)
        : null}
    </>
  );
}
