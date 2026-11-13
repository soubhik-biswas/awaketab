'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/product/toasts';
import { toFaceId } from '@/components/face';
import { MiniChip, type TMiniChip } from '@/components/pip/mini-chip';
import { MINI_CLOSE_MS, MiniView, type IMiniActions, type IMiniSound } from '@/components/pip/mini-view';
import type { TLocale } from '@/i18n/locales';
import { cn } from '@/lib/utils';
import { localeDial } from '@/lib/clock-format';
import { LAYERS, setMix, useSound, type TMix } from '@/lib/tool/sound-mix';
import { SCENES, sceneOf } from '@/lib/tool/sound-scenes';
import { updateSettings, useToolSettings, type IToolSettings } from '@/lib/tool/settings';
import { isToolLang, type TToolLang } from '@/lib/tool/strings';
import { useFaceTheme, useMounted, useWindowNow } from '@/lib/surfaces/hooks';
import { hostMirror } from '@/lib/surfaces/mirror';
import { holdOwnLock, type TOwnLock } from '@/lib/surfaces/own-lock';
import {
  dressWindow,
  miniTier,
  openDocumentPip,
  openPopup,
  pipSupport,
  readMiniSize,
  watchAutoPip,
} from '@/lib/surfaces/pip';
import { EXTEND_SEC, surfaceView } from '@/lib/surfaces/session';
import { isAwake, isLive, useWake, wake, type TWakeState } from '@/lib/wake';

type TPipOpen = { kind: 'document' | 'popup'; win: Window; auto: boolean } | null;

const OFFER_MS = 45_000;

export function miniLang(locale: string): TToolLang {
  return isToolLang(locale) ? locale : 'en';
}

// The tool's dial: the person's choice, else the language's own.
export function miniDial(settings: Pick<IToolSettings, 'clockSet' | 'h12'>, lang: TToolLang): 12 | 24 {
  return settings.clockSet ? (settings.h12 ? 12 : 24) : localeDial(lang);
}

function toggleSession() {
  const s = wake.getSnapshot().state;
  if (s === 'paused' || s === 'needsyou') wake.resume();
  else if (isAwake(s)) wake.pause();
}

// Space pauses or resumes and P closes the window, as in the tool's keyboard map. Closing never stops the session.
export function pipKeys(win: Window, keys: { toggle?: () => void; close: () => void }): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    // The target lives in the mini window's own realm, so it is not an instance of this window's HTMLElement.
    const target = e.target as Partial<Pick<Element, 'closest'>> | null;
    const onButton = typeof target?.closest === 'function' && target.closest('button') !== null;
    if (e.key === 'p' || e.key === 'P') keys.close();
    else if (e.key === ' ' && !onButton && keys.toggle) {
      e.preventDefault();
      keys.toggle();
    }
  };
  win.addEventListener('keydown', onKey);
  return () => win.removeEventListener('keydown', onKey);
}

// `attempt` asks again from a tap in the mini window, which some browsers need after a refusal.
export function useOwnLock(win: Window | null, wanted: boolean, attempt = 0): boolean {
  const [own, setOwn] = useState<TOwnLock>('off');
  useEffect(() => {
    if (!win || !wanted) return;
    return holdOwnLock(win, setOwn);
  }, [win, wanted, attempt]);
  return wanted && own === 'held';
}

// The mini clock stays for Time's up (it offers to start again) and closes once the session is stopped.
export function useCloseOnStop(state: TWakeState, close: () => void): void {
  const was = useRef(state);
  useEffect(() => {
    if (isLive(was.current) && state === 'idle') close();
    was.current = state;
  }, [state, close]);
}

// The focus sound: what plays, on or off, and a step through the scenes. Playing with every layer off starts Deep
// focus, so the button always makes a sound.
export function useMiniSound(): IMiniSound {
  const { mix } = useSound();
  const { ambientOn } = useToolSettings();
  const t = useTranslations('tool.glance.sound');
  const layers = LAYERS.filter((k) => mix[k] > 0).sort((x, y) => mix[y] - mix[x]);
  const silent = layers.length === 0;
  const scene = silent ? 'focus' : sceneOf(mix);
  const name = scene
    ? t(`mix.${scene}`)
    : layers
        .slice(0, 2)
        .map((k) => t(k))
        .join(' + ');
  const play = (next: TMix | null) => {
    if (next) setMix(next);
    if (!ambientOn) updateSettings({ ambientOn: true });
  };
  return {
    on: ambientOn && !silent,
    name,
    scene,
    toggle: () =>
      ambientOn && !silent ? updateSettings({ ambientOn: false }) : play(silent ? (SCENES[0]?.[1] ?? null) : null),
    step: (dir) => {
      const at = SCENES.findIndex(([n]) => n === scene);
      const to = at < 0 ? (dir > 0 ? 0 : SCENES.length - 1) : (at + dir + SCENES.length) % SCENES.length;
      play(SCENES[to]?.[1] ?? null);
    },
  };
}

// The mini clock inside the floating window: the tool's own session, with a wake lock held by that window.
function FloatingClock({ win, onClose, leaving }: { win: Window; onClose: () => void; leaving: boolean }) {
  const snap = useWake();
  const now = useWindowNow(win);
  const locale = useLocale();
  const settings = useToolSettings();
  const theme = useFaceTheme();
  const sound = useMiniSound();
  const [attempt, setAttempt] = useState(0);
  const live = isLive(snap.state);
  const held = useOwnLock(win, live && snap.pausedAt === null, attempt);
  const lang = miniLang(locale);
  const fmt = miniDial(settings, lang);
  const view = surfaceView({ ...snap, now }, { held, locale, fmt });
  const canLock = 'wakeLock' in win.navigator;
  useEffect(() => pipKeys(win, { toggle: toggleSession, close: onClose }), [win, onClose]);
  useCloseOnStop(snap.state, onClose);
  const actions: IMiniActions = {
    pause: () => wake.pause(),
    resume: () => wake.resume(),
    extend: () => wake.extend(EXTEND_SEC),
    stop: () => wake.stop(),
    start: () => wake.start(settings.totalSec),
    retry: canLock
      ? () => {
          setAttempt((n) => n + 1);
          wake.resume();
        }
      : undefined,
    sound,
  };
  return (
    <MiniView
      view={view}
      theme={theme}
      face={toFaceId(settings.face)}
      lang={lang}
      fmt={fmt}
      now={now}
      size="expanded"
      actions={actions}
      leaving={leaving}
      className="h-dvh w-screen"
    />
  );
}

// Any part of the tool can open the mini clock by dispatching this event on window.
export const PIP_EVENT = 'awaketab:pip';

export interface IPipLauncherProps {
  className?: string;
  style?: CSSProperties;
  label?: string;
  hideButton?: boolean;
  // Inside the tool: the automatic open, the one-tap offer and the "mini clock is open" line.
  inTool?: boolean;
}

// "Pop out mini clock": Document Picture-in-Picture where the browser has it, else the /pip popup that mirrors this
// tab over BroadcastChannel; hidden, not disabled, where neither works.
export function PipLauncher({ className, style, label, hideButton = false, inTool = false }: IPipLauncherProps) {
  const t = useTranslations('surfaces.pip');
  const locale = useLocale() as TLocale;
  const mounted = useMounted();
  const settings = useToolSettings();
  const state = useWake().state;
  const live = isLive(state);
  const [open, setOpen] = useState<TPipOpen>(null);
  const [leaving, setLeaving] = useState(false);
  const [chip, setChip] = useState<Exclude<TMiniChip, 'open'> | null>(null);
  const current = useRef<TPipOpen>(null);
  const undress = useRef<(() => void) | null>(null);
  const backAt = useRef(0);
  const support = mounted ? pipSupport() : 'none';
  const tier = mounted ? miniTier() : 'none';
  const autoOn = inTool && tier === 'auto' && settings.autoMini && live;

  const show = useCallback((next: TPipOpen) => {
    current.current = next;
    setOpen(next);
    setLeaving(false);
  }, []);

  const close = useCallback(() => {
    const cur = current.current;
    if (cur && !cur.win.closed) cur.win.close();
    show(null);
  }, [show]);

  // A short fade inside the window first; its own timer runs while this tab is in the background.
  const closeCalm = useCallback(() => {
    const cur = current.current;
    if (!cur || cur.win.closed || cur.win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      close();
      return;
    }
    setLeaving(true);
    cur.win.setTimeout(close, MINI_CLOSE_MS);
  }, [close]);

  useEffect(() => {
    if (open?.kind !== 'popup') return;
    const stopHost = hostMirror(wake.getSnapshot, wake.subscribe, {
      extend: (sec) => wake.extend(sec),
      stop: () => wake.stop(),
    });
    const id = setInterval(() => {
      if (open.win.closed) show(null);
    }, 1000);
    return () => {
      stopHost();
      clearInterval(id);
    };
  }, [open, show]);

  useEffect(() => {
    if (open?.kind !== 'document') return;
    const win = open.win;
    const onHide = () => {
      undress.current?.();
      undress.current = null;
      if (current.current?.win === win) show(null);
    };
    win.addEventListener('pagehide', onHide);
    return () => win.removeEventListener('pagehide', onHide);
  }, [open, show]);

  useEffect(() => () => undress.current?.(), []);

  // No wait may come before requestWindow: the tap, or the browser's own call when the tab is left, allows it once.
  const pop = async (auto: boolean) => {
    const cur = current.current;
    if (cur && !cur.win.closed) return;
    const asked = Date.now();
    if (support === 'document') {
      const win = await openDocumentPip(readMiniSize());
      if (win) {
        undress.current?.();
        undress.current = dressWindow(win);
        win.document.title = t('title');
        setChip(null);
        show({ kind: 'document', win, auto });
        // Back in the tab before the window arrived: what opened by itself goes again.
        if (auto && backAt.current >= asked) {
          win.close();
          show(null);
        }
        return;
      }
    }
    if (auto) return;
    const win = openPopup(locale);
    if (win) {
      setChip(null);
      show({ kind: 'popup', win, auto: false });
    } else showToast({ id: 'pip-blocked', tone: 'error', title: t('popupBlocked') });
  };
  const popRef = useRef(pop);
  useEffect(() => {
    popRef.current = pop;
  });

  useEffect(() => {
    const onAsk = () => void popRef.current(false);
    window.addEventListener(PIP_EVENT, onAsk);
    return () => window.removeEventListener(PIP_EVENT, onAsk);
  }, []);

  // Automatic: leaving the tab during a session opens the mini clock where the browser allows it.
  const fired = useRef(false);
  useEffect(() => {
    if (!autoOn) return;
    return watchAutoPip(() => {
      fired.current = true;
      void popRef.current(true);
    });
  }, [autoOn]);

  // Coming back closes only what opened by itself. When the browser was asked and did not open it, the next look
  // at the tab offers it once, with one tap.
  const away = useRef(false);
  const missedOnce = useRef(false);
  const autoRef = useRef(autoOn);
  useEffect(() => {
    autoRef.current = autoOn;
  }, [autoOn]);
  useEffect(() => {
    if (!inTool) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        away.current = autoRef.current && current.current === null;
        return;
      }
      backAt.current = Date.now();
      const cur = current.current;
      if (cur?.auto) closeCalm();
      if (away.current && !fired.current && !cur && autoRef.current && !missedOnce.current) {
        missedOnce.current = true;
        setChip('missed');
      }
      away.current = false;
      fired.current = false;
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [inTool, closeCalm]);

  // One tap: where the browser never opens it by itself, a session that starts offers it once.
  const wasLive = useRef<boolean | null>(null);
  useEffect(() => {
    if (!mounted || !inTool) return;
    const prev = wasLive.current;
    wasLive.current = live;
    if (prev === null || prev === live) return;
    if (live && tier === 'tap' && settings.autoMini && current.current === null) setChip('offer');
    if (!live) {
      setChip(null);
      missedOnce.current = false;
    }
  }, [live, mounted, inTool, tier, settings.autoMini]);

  useEffect(() => {
    if (!chip) return;
    const id = setTimeout(() => setChip(null), OFFER_MS);
    return () => clearTimeout(id);
  }, [chip]);

  if (support === 'none') return null;
  const shownChip: TMiniChip | null = open ? 'open' : chip && live && settings.autoMini ? chip : null;
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
          onClick={() => void pop(false)}
        >
          {label ?? t('open')}
        </Button>
      )}
      {inTool ? (
        <MiniChip kind={shownChip} onOpen={() => void pop(false)} onDismiss={() => setChip(null)} onClose={closeCalm} />
      ) : null}
      {open?.kind === 'document'
        ? createPortal(<FloatingClock win={open.win} onClose={closeCalm} leaving={leaving} />, open.win.document.body)
        : null}
    </>
  );
}
