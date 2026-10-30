'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { X } from 'lucide-react';
import { createStorage, type TFace } from '@awaketab/core';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/format';
import { CHROME, fill, lengthText } from '@/lib/tool/chrome';
import { clockTime } from '@/lib/tool/clock';
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
import { ControlBar } from '@/components/tool/bar';
import { useLampLight } from '@/components/tool/motion';
import { Stage } from '@/components/tool/stage';
import { toolToast, ToolToaster } from '@/components/tool/toasts';
import './tool.css';

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

// The handoff's layout tiers: desktop from 1300, tablet landscape from 1100, tablet portrait from 700.
function deviceFor(w: number): TDevice {
  if (w >= 1300) return 'desktop';
  if (w >= 1100) return 'tabletL';
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
  const c = CHROME[lang];
  const time = an.endsAt === null ? '' : clockTime(an.endsAt, lang, fmt);
  switch (an.kind) {
    case 'start':
      return time ? fill(c.anStart, { time }) : c.anStartOpen;
    case 'extend':
      return fill(c.anExtend, { n: Math.round(an.extendSec / 60), time });
    case 'lowtime':
      return c.anLow;
    case 'hidden':
      return c.anHidden;
    case 'refused':
      return c.anRefused;
    case 'ended':
      return fill(c.anEnded, { time: clockTime(Date.now(), lang, fmt) });
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
  useEffect(() => {
    // Loaded after the first paint so the sign-in client never weighs on the tool's start.
    void import('@/lib/pro/client').then((m) => m.connectPro());
  }, []);
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
        const { s, c } = cur.m;
        toolToast.show({
          id: 'preset-saved',
          tone: 'success',
          title: fill(c.savedPreset, { label: p.label }),
          description: fill(c.savedPresetD, { len: lengthText(p.totalSec, s, c), n: Math.min(9, presets.length + 1) }),
        });
      },
      copyLink: () => {
        void navigator.clipboard?.writeText(shareUrlRef.current).catch(() => undefined);
        toolUi.set({ copied: true });
        toolToast.copied(latest.current.m.c);
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
        toolToast.extended(l.c, {
          until: clockTime(endsAt + (toolUi.get().qa.offsetMs ?? 0), l.lang, l.fmt),
          minutes: Math.round(sec / 60),
          onUndo: () => wake.undoExtend(),
        });
      }),
      wake.on('lowtime', ({ endsAt }) => {
        const l = latest.current.m;
        toolToast.lowTime(l.c, {
          endsAt: clockTime(endsAt + (toolUi.get().qa.offsetMs ?? 0), l.lang, l.fmt),
          extendLabel: l.s.ext15,
          onExtend: () => wake.extend(900),
        });
      }),
      wake.on('ended', ({ endedAt }) => {
        const l = latest.current;
        playChime(l.settings.chime);
        toolToast.ended(l.m.c, {
          endedAt: clockTime(endedAt + (toolUi.get().qa.offsetMs ?? 0), l.m.lang, l.m.fmt),
          againLabel: l.m.s.again,
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
    const { s, c } = m;
    let title = base;
    if (awake && !m.indef)
      title = `${fill(c.tabLeft, { t: settings.secs ? formatDuration(m.remain) : `${Math.ceil(m.remain / 60)}${s.min}` })} · ${base}`;
    else if (awake) title = `${c.tabAwake} · ${base}`;
    else if (m.state === 'paused') title = `${s.paused} · ${base}`;
    else if (m.state === 'blocked') title = `${c.tabBlocked} · ${base}`;
    else if (m.state === 'ended') title = `${c.tabUp} · ${base}`;
    document.title = title;
  }, [awake, m, settings.secs]);

  const sizes = DEVICE_SIZES[device];
  const focus = ui.view === 'focus';

  // A new build announces itself with this event; the banner offers a reload that keeps the session.
  useEffect(() => {
    const onUpdate = () => toolUi.set({ update: true });
    window.addEventListener('awaketab:update', onUpdate);
    return () => window.removeEventListener('awaketab:update', onUpdate);
  }, []);

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

  const topH = focus ? 0 : sizes.top;
  const barH = focus ? 0 : sizes.bar;
  const faceSize = focus ? Math.round(Math.min(frame.w, frame.h) * (device === 'phone' ? 0.86 : 0.72)) : sizes.face;
  const glowAmt = Math.max(0, Math.min(100, pro.isPro ? pro.studio.glow : 70)) / 70;
  const announce = snap.announce ? announceText(snap.announce, lang, m.fmt) : '';
  const assertive = snap.announce?.kind === 'refused';

  return (
    <ToolContext.Provider value={ctx}>
      {!focus || night ? <Glow awake={awake} amount={glowAmt} height={frame.h} /> : null}
      {!focus ? <ToolHeader /> : null}
      <Stage ref={stageRef} faceSize={faceSize} top={topH} bottom={barH} />
      {!focus ? <ControlBar /> : null}
      <ToolHost />
      {focus ? (
        <Button
          type="button"
          variant="outline"
          onClick={close}
          className="absolute top-4 right-4 z-[7] h-11 gap-2 rounded-[10px] border-border bg-(--tool-exit) px-4 text-[14px] font-semibold text-foreground [&_svg]:size-[18px]"
        >
          <X strokeWidth={2} aria-hidden="true" />
          {m.c.exitFull} <Kbd className={KBD}>Esc</Kbd>
        </Button>
      ) : null}
      <ToolToaster bottom={focus ? 24 : sizes.bar + 12} phoneBottom={focus ? 24 : sizes.bar + 12} />
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

// The room glow behind the clock: volt top left, violet lower right; it brightens when the lamp lights.
function Glow({ awake, amount, height }: { awake: boolean; amount: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLampLight(ref, awake);
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ opacity: amount }}>
        <div
          className={cn(
            'absolute h-[640px] w-[760px] rounded-full',
            awake
              ? 'bg-[radial-gradient(closest-side,var(--tool-glow-a-awake),transparent)]'
              : 'bg-[radial-gradient(closest-side,var(--tool-glow-a),transparent)]',
          )}
          style={{ left: 'calc(50% - 520px)', top: Math.round(height * 0.06) }}
        />
        <div
          className={cn(
            'absolute h-[600px] w-[680px] rounded-full',
            awake
              ? 'bg-[radial-gradient(closest-side,var(--tool-glow-b-awake),transparent)]'
              : 'bg-[radial-gradient(closest-side,var(--tool-glow-b),transparent)]',
          )}
          style={{ left: 'calc(50% - 120px)', top: Math.round(height * 0.28) }}
        />
      </div>
    </div>
  );
}
