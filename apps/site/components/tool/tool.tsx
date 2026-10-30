'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { X } from 'lucide-react';
import { createStorage, type TFace } from '@awaketab/core';
import {
  showCopiedToast,
  showEndedToast,
  showExtendedToast,
  showLowTimeToast,
  showToast,
} from '@/components/product/toasts';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/format';
import { clockTime, lengthWords } from '@/lib/tool/clock';
import { rememberOpener, returnFocus } from '@/lib/tool/focus';
import { addHistory, clearHistory, useHistory } from '@/lib/tool/history';
import { deriveModel, DEVICE_SIZES, type TFaceTheme } from '@/lib/tool/model';
import { iconForLabel, savePreset, usePresets } from '@/lib/tool/presets';
import { usePro } from '@/lib/tool/pro';
import { readToolQuery, sharePath } from '@/lib/tool/share';
import { setAmbient } from '@/lib/tool/sound';
import { playChime } from '@/lib/tool/sound';
import { updateSettings, useToolSettings, type TThemeChoice } from '@/lib/tool/settings';
import type { TToolLang } from '@/lib/tool/strings';
import { toolUi, useToolUi, type TDevice, type TToolView } from '@/lib/tool/ui';
import { isAwake, isLive, useWake, wake, type IAnnounce } from '@/lib/wake';
import { useOnline } from '@/hooks/use-online';
import { useToolKeys } from '@/hooks/use-tool-keys';
import { ToolContext, type IToolActions, type IToolContext } from '@/components/tool/context';
import { ToolHeader } from '@/components/tool/header';
import { ToolHost } from '@/components/tool/host';
import { KBD } from '@/components/tool/kit';
import { BottomNav, SideNav } from '@/components/tool/nav';
import { Stage } from '@/components/tool/stage';

const ToolPalette = dynamic(() => import('@/components/tool/palette').then((mod) => mod.ToolPalette), { ssr: false });
const QaBridge = dynamic(() => import('@/components/tool/qa-bridge').then((mod) => mod.QaBridge), { ssr: false });

export interface IToolProps {
  lang?: TToolLang;
  initialView?: TToolView;
  welcome?: boolean;
  readQuery?: boolean;
  qa?: boolean;
  className?: string;
}

const WELCOME_TIP = 'welcome';

function deviceFor(w: number): TDevice {
  if (w >= 1280) return 'desktop';
  if (w >= 1024) return 'tabletL';
  if (w >= 700) return 'tabletP';
  return 'phone';
}

function useFrameSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      setSize((prev) =>
        prev && prev.w === Math.round(r.width) && prev.h === Math.round(r.height)
          ? prev
          : { w: Math.round(r.width), h: Math.round(r.height) },
      );
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

const noopSubscribe = () => () => undefined;

function useOrigin(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => '',
  );
}

function announceText(an: IAnnounce, lang: TToolLang, fmt: 12 | 24): string {
  const at = an.endsAt === null ? '' : clockTime(an.endsAt, lang, fmt);
  switch (an.kind) {
    case 'start':
      return at ? `Screen awake until ${at}.` : 'Screen awake, no end.';
    case 'extend':
      return `Extended by ${Math.round(an.extendSec / 60)} minutes. Now until ${at}.`;
    case 'lowtime':
      return '5 minutes left. Extend with plus.';
    case 'hidden':
      return 'Paused — come back to this tab to continue.';
    case 'refused':
      return 'Not awake. The browser refused the lock. See the fix.';
    case 'ended':
      return `Time’s up. Ended at ${clockTime(Date.now(), lang, fmt)}; the screen can sleep again.`;
  }
}

function markWelcomed() {
  try {
    const store = createStorage();
    const ob = store.onboarding();
    if (!ob.dismissedTips.includes(WELCOME_TIP))
      store.writeOnboarding({ ...ob, dismissedTips: [...ob.dismissedTips, WELCOME_TIP] });
  } catch {
    // Storage blocked: the welcome may show again next visit.
  }
}

function welcomed(): boolean {
  try {
    return createStorage().onboarding().dismissedTips.includes(WELCOME_TIP);
  } catch {
    return true;
  }
}

export function Tool({
  lang = 'en',
  initialView,
  welcome = true,
  readQuery = true,
  qa = false,
  className,
}: IToolProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const size = useFrameSize(frameRef);
  return (
    <div
      ref={frameRef}
      lang={lang}
      data-slot="tool"
      className={cn('relative h-dvh w-full overflow-hidden bg-background font-sans text-foreground', className)}
    >
      {size ? (
        <ToolApp lang={lang} frame={size} initialView={initialView} welcome={welcome} readQuery={readQuery} qa={qa} />
      ) : null}
    </div>
  );
}

function ToolApp({
  lang,
  frame,
  initialView,
  welcome,
  readQuery,
  qa,
}: Required<Pick<IToolProps, 'lang' | 'welcome' | 'readQuery' | 'qa'>> & {
  frame: { w: number; h: number };
  initialView?: TToolView;
}) {
  const snap = useWake();
  const settings = useToolSettings();
  const ui = useToolUi();
  const pro = usePro();
  const presets = usePresets();
  const history = useHistory();
  const online = useOnline();
  const origin = useOrigin();
  const { theme: themeSetting, resolvedTheme, setTheme } = useTheme();
  const stageRef = useRef<HTMLElement>(null);
  const device = deviceFor(frame.w);
  const theme: TFaceTheme = resolvedTheme === 'light' ? 'light' : resolvedTheme === 'oled' ? 'oled' : 'dark';
  const night = theme !== 'light';
  const themeChoice: TThemeChoice =
    themeSetting === 'light' || themeSetting === 'dark' || themeSetting === 'oled' ? themeSetting : 'auto';
  const m = useMemo(
    () => deriveModel(snap, settings, lang, ui.qa.offsetMs ?? 0),
    [snap, settings, lang, ui.qa.offsetMs],
  );
  const latest = useRef({ m, settings });
  latest.current = { m, settings };

  const go = useCallback((view: TToolView) => {
    rememberOpener();
    if (view === 'focus') void document.documentElement.requestFullscreen?.().catch(() => undefined);
    toolUi.go(view);
  }, []);

  const close = useCallback(() => {
    const view = toolUi.get().view;
    if (view === 'welcome') markWelcomed();
    if (view === 'focus' && document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    toolUi.close();
    if (view === 'focus') returnFocus(stageRef.current);
  }, []);

  const setLength = useCallback((sec: number) => {
    wake.setLength(sec);
    if (!isLive(wake.getSnapshot().state)) updateSettings({ totalSec: sec });
  }, []);

  const a: IToolActions = useMemo(
    () => ({
      start: (sec) => wake.start(sec ?? latest.current.settings.totalSec),
      toggle: () => {
        const st = wake.getSnapshot().state;
        if (st === 'idle' || st === 'ended') wake.start(latest.current.settings.totalSec);
        else wake.toggle();
      },
      pause: () => wake.pause(),
      resume: () => wake.resume(),
      stop: () => wake.stop(),
      extend: (sec) => wake.extend(sec),
      undo: () => wake.undoExtend(),
      setLength,
      until: (endsAt) => wake.until(endsAt),
      useFallback: () => {
        wake.useFallback();
        if (toolUi.get().view === 'fix') toolUi.close();
      },
      checkAgain: () => {
        wake.checkAgain();
        if (toolUi.get().view === 'fix') toolUi.close();
      },
      takeOver: () => wake.takeOver(),
      dismissPeer: () => wake.dismissPeer(),
      go,
      close,
      setFace: (face: TFace) => updateSettings({ face }),
      setTheme: (choice) => {
        setTheme(choice === 'auto' ? 'system' : choice);
        updateSettings({ theme: choice });
      },
      cycleTheme: () => {
        const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'oled' : 'light';
        setTheme(next);
        updateSettings({ theme: next });
      },
      applyPreset: (p, start = false) => {
        const cur = latest.current.settings;
        updateSettings({ face: p.face, chime: p.chime ? (cur.chime === 'off' ? 'two' : cur.chime) : 'off' });
        setLength(p.totalSec);
        toolUi.close();
        if (start && !isAwake(wake.getSnapshot().state)) wake.start(p.totalSec);
      },
      savePreset: () => {
        const cur = latest.current;
        const p = savePreset({
          label: cur.settings.label,
          totalSec: cur.m.total,
          face: cur.settings.face,
          chime: cur.settings.chime !== 'off',
        });
        showToast({
          id: 'preset-saved',
          tone: 'success',
          title: `Saved “${p.label}”`,
          description: `${p.totalSec === 0 ? 'No end' : lengthWords(p.totalSec)} · press ${Math.min(9, presets.length + 1)} to start it.`,
        });
      },
      copyLink: () => {
        void navigator.clipboard?.writeText(shareUrlRef.current).catch(() => undefined);
        toolUi.set({ copied: true });
        showCopiedToast();
      },
      clearHistory: () => {
        clearHistory();
        toolUi.go('history');
      },
      updateSettings,
    }),
    [setLength, go, close, setTheme, theme, presets.length],
  );

  const shareUrl = `${origin}${sharePath({ face: settings.face, minutes: Math.round(settings.totalSec / 60), chime: settings.chime !== 'off' })}`;
  const shareUrlRef = useRef(shareUrl);
  shareUrlRef.current = shareUrl;

  // First paint: address options, then the first-visit welcome.
  useEffect(() => {
    if (initialView) toolUi.go(initialView);
    const q = readQuery ? readToolQuery(window.location.search) : {};
    if (q.face) updateSettings({ face: q.face });
    if (q.chime !== undefined) updateSettings({ chime: q.chime ? 'two' : 'off' });
    if (q.totalSec !== undefined) setLength(q.totalSec);
    if (q.untilAt) wake.until(q.untilAt);
    else if (q.autostart) wake.start(q.totalSec ?? latest.current.settings.totalSec);
    else if (!initialView && welcome && !welcomed() && wake.getSnapshot().state === 'idle') toolUi.go('welcome');
  }, [initialView, readQuery, welcome, setLength]);

  useEffect(() => {
    const offs = [
      wake.on('extended', ({ sec, endsAt }) => {
        const l = latest.current.m;
        showExtendedToast({
          until: clockTime(endsAt + (toolUi.get().qa.offsetMs ?? 0), l.lang, l.fmt),
          minutes: Math.round(sec / 60),
          onUndo: () => wake.undoExtend(),
        });
      }),
      wake.on('lowtime', ({ endsAt }) => {
        const l = latest.current.m;
        showLowTimeToast({
          endsAt: clockTime(endsAt + (toolUi.get().qa.offsetMs ?? 0), l.lang, l.fmt),
          onExtend: () => wake.extend(900),
        });
      }),
      wake.on('ended', ({ endedAt }) => {
        const l = latest.current;
        playChime(l.settings.chime);
        showEndedToast({
          endedAt: clockTime(endedAt + (toolUi.get().qa.offsetMs ?? 0), l.m.lang, l.m.fmt),
          onStartAgain: () => setLength(l.m.total),
        });
      }),
      wake.on('finished', (f) => {
        const l = latest.current.settings;
        addHistory({
          label: l.label,
          icon: iconForLabel(l.label, f.totalSec),
          face: l.face,
          startedAt: f.startedAt,
          endedAt: f.endedAt,
          totalSec: f.totalSec,
          awakeSec: f.awakeSec,
          reason: f.reason,
        });
      }),
    ];
    return () => {
      for (const off of offs) off();
    };
  }, [setLength]);

  const awake = isAwake(snap.state);
  useEffect(() => {
    setAmbient(pro.mix, awake && pro.isPro);
  }, [awake, pro.mix, pro.isPro]);

  // The tab title carries the countdown, so a glance at the tab bar is enough.
  useEffect(() => {
    const base = 'AwakeTab';
    let title = base;
    if (awake && !m.indef)
      title = `${settings.secs ? formatDuration(m.remain) : `${Math.ceil(m.remain / 60)} min`} left · ${base}`;
    else if (awake) title = `Awake · ${base}`;
    else if (m.state === 'paused') title = `Paused · ${base}`;
    else if (m.state === 'blocked') title = `Blocked · ${base}`;
    else if (m.state === 'ended') title = `Time’s up · ${base}`;
    document.title = title;
  }, [awake, m.indef, m.remain, m.state, settings.secs]);

  // Toasts sit above the tab bar on phone and tablet portrait, and clear of the panel on wider screens.
  const sizes = DEVICE_SIZES[device];
  const focus = ui.view === 'focus';
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--toast-offset-bottom', sizes.bnav && !focus ? `${sizes.bnav + 12}px` : '24px');
    root.setProperty('--toast-offset-bottom-mobile', sizes.bnav && !focus ? `${sizes.bnav + 12}px` : '12px');
    root.setProperty('--toast-offset-right', sizes.panel && !focus ? `${sizes.panel + 24}px` : '24px');
    return () => {
      root.removeProperty('--toast-offset-bottom');
      root.removeProperty('--toast-offset-bottom-mobile');
      root.removeProperty('--toast-offset-right');
    };
  }, [sizes.bnav, sizes.panel, focus]);

  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement && toolUi.get().view === 'focus') close();
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, [close]);

  const ctx: IToolContext = {
    m,
    snap,
    settings,
    ui,
    device,
    theme,
    themeChoice,
    night,
    viewport: frame,
    pro,
    presets,
    history,
    online,
    shareUrl,
    a,
  };

  useToolKeys(ctx, stageRef);

  const sideW = focus ? 0 : sizes.side;
  const panelW = focus ? 0 : sizes.panel;
  const topH = focus ? 0 : sizes.top;
  const bnavH = focus ? 0 : sizes.bnav;
  const faceSize = focus ? Math.round(Math.min(frame.w, frame.h) * (device === 'phone' ? 0.86 : 0.72)) : sizes.face;
  const glowAmt = Math.max(0, Math.min(100, pro.isPro ? pro.studio.glow : 70)) / 70;
  const announce = snap.announce ? announceText(snap.announce, lang, m.fmt) : '';
  const assertive = snap.announce?.kind === 'refused';

  return (
    <ToolContext.Provider value={ctx}>
      {!focus || night ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0"
          style={{ left: sideW, right: panelW, opacity: glowAmt }}
        >
          <div
            className={cn(
              'absolute h-[640px] w-[760px] rounded-full',
              awake
                ? 'bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--lamp)_10%,transparent),transparent)] dark:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--lamp)_22%,transparent),transparent)]'
                : 'bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--info)_6%,transparent),transparent)] dark:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--info)_12%,transparent),transparent)]',
            )}
            style={{ left: 'calc(50% - 520px)', top: Math.round(frame.h * 0.06) }}
          />
          <div
            className={cn(
              'absolute h-[600px] w-[680px] rounded-full',
              awake
                ? 'bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--primary)_7%,transparent),transparent)] dark:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--primary)_16%,transparent),transparent)]'
                : 'bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--ended)_4%,transparent),transparent)] dark:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--ended)_8%,transparent),transparent)]',
            )}
            style={{ left: 'calc(50% - 120px)', top: Math.round(frame.h * 0.28) }}
          />
        </div>
      ) : null}
      {!focus ? <ToolHeader /> : null}
      {!focus && sizes.side > 0 ? <SideNav /> : null}
      <Stage ref={stageRef} faceSize={faceSize} left={sideW} right={panelW} top={topH} bottom={bnavH} />
      <ToolHost panelTop={sizes.top} panelWidth={sizes.panel} />
      {!focus && sizes.bnav > 0 ? <BottomNav /> : null}
      {focus ? (
        <Button
          type="button"
          variant="outline"
          onClick={close}
          className="absolute top-4 right-4 z-[7] h-11 gap-2 rounded-[10px] border-border bg-card/85 px-4 text-[14px] font-semibold dark:bg-secondary/80 [&_svg]:size-[18px]"
        >
          <X strokeWidth={2} aria-hidden="true" />
          Exit fullscreen <Kbd className={KBD}>Esc</Kbd>
        </Button>
      ) : null}
      {ui.view === 'palette' ? <ToolPalette /> : null}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {assertive ? '' : announce}
      </span>
      <span className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {assertive ? announce : ''}
      </span>
      {qa ? <QaBridge /> : null}
    </ToolContext.Provider>
  );
}
