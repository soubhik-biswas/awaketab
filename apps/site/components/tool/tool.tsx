'use client';

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MotionConfig } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useMediaQuery } from 'usehooks-ts';
import { ToolSurfaces } from '@/components/pip/tool-surfaces';
import { isLocale, localePath } from '@/i18n/locales';
import { cn } from '@/lib/utils';
import { localeDial } from '@/lib/clock-format';
import { formatDuration } from '@/lib/format';
import { clockTime, clockUntil, isLate, secondsOfDay } from '@/lib/tool/clock';
import { glanceFace } from '@/lib/tool/collections';
import { addHistory, useHistory } from '@/lib/tool/history';
import { countSession, firstDone, markSeen, nudgeDue, quietNudge, useJourney } from '@/lib/tool/journey';
import { iconForLabel, savePreset, usePresets } from '@/lib/tool/presets';
import { usePro } from '@/lib/tool/pro';
import { readToolQuery, stripToolQuery } from '@/lib/tool/share';
import { playChime, setAmbient } from '@/lib/tool/sound';
import { STAGE_ID } from '@/lib/tool/stage-id';
import { UPDATE_EVENT, watchForUpdate } from '@/lib/tool/update';
import { updateSettings, useToolSettings, type IToolSettings, type TThemeChoice } from '@/lib/tool/settings';
import type { TToolLang } from '@/lib/tool/strings';
import { toolUi, useToolUi, type TBlockReason, type TPanel } from '@/lib/tool/ui';
import { isAwake, isLive, remainSec, wake } from '@/lib/wake';
import { useOnline } from '@/hooks/use-online';
import { Backdrop } from './backdrop';
import { Banner } from './banner';
import { ToolBoundary } from './boundary';
import {
  ToolContext,
  useGlance,
  useTickValue,
  type IGlance,
  type IToolActions,
  type TBannerKind,
  type TT,
} from './context';
import { Dock, DOCK_BOTTOM, DOCK_H } from './dock';
import { deviceFor } from './fit';
import { useFrame, useFullscreen, useIdle, useLowBattery, useWakeStill, useWakeValue, type TWakeStill } from './hooks';
import { useKeys } from './keys';
import { ControlsHint, Nudge, showExtended, showNote, ToolToaster } from './overlays';
import { LazyPalette, LazyPanels } from './panels/lazy';
import { START_QUEUED, ToolShell } from './shell';
import { Stage } from './stage';
import { TopBar, TopPlaces } from './top-bar';
import './glance.css';

const QaBridge = dynamic(() => import('./qa-bridge').then((m) => m.QaBridge), { ssr: false });

export interface IToolProps {
  lang?: TToolLang;
  initialView?: TPanel;
  readQuery?: boolean;
  qa?: boolean;
  className?: string;
}

function reasonFor(snap: TWakeStill, low: boolean): TBlockReason {
  if (snap.advice === 'insecure_context') return 'insecure';
  if (snap.advice === 'permissions_policy' || snap.advice === 'iframe_no_allow') return 'policy';
  return low ? 'battery' : 'unknown';
}

// The tab title is live: "59:12 left · AwakeTab".
function TabTitle() {
  const g = useGlance();
  const { t, st, indef } = g;
  const awake = isAwake(st);
  const secs = g.settings.secs;
  const left = useTickValue((tick) =>
    awake && !indef ? (secs ? formatDuration(tick.remain) : g.dur(tick.remain)) : '',
  );
  const baseTitle = useRef<string | null>(null);
  useEffect(() => {
    baseTitle.current ??= document.title;
    const base = 'AwakeTab';
    let title = baseTitle.current;
    if (awake && !indef) title = `${t('tab.left', { t: left })} · ${base}`;
    else if (awake) title = `${t('tab.awake')} · ${base}`;
    else if (st === 'paused') title = `${t('tab.paused')} · ${base}`;
    else if (st === 'blocked' || st === 'needsyou') title = `${t('tab.blocked')} · ${base}`;
    else if (st === 'ended') title = `${t('tab.up')} · ${base}`;
    document.title = title;
  }, [awake, indef, left, st, t]);
  return null;
}

const Surfaces = memo(ToolSurfaces);

// The tool: the home page's first screen. It measures its own frame and lays out to the device tier it finds. Until
// it has measured (on the server and in the first paint) it shows Set mode at rest as plain markup, so the headline
// and the start button are in the HTML and the window is never read during render.
export function Tool({ lang = 'en', initialView, readQuery = true, qa = false, className }: IToolProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const attach = useCallback((el: HTMLDivElement | null) => {
    ref.current = el;
    setRoot(el);
  }, []);
  const size = useFrame(ref);
  const state = useWakeValue((snap) => snap.state);
  // A tab in the background pauses every animation in the tool.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => el.toggleAttribute('data-away', document.visibilityState === 'hidden');
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  return (
    <div
      ref={attach}
      lang={lang}
      data-slot="tool"
      data-state={state}
      className={cn('relative h-dvh w-full overflow-hidden font-sans', className)}
    >
      <ToolBoundary>
        <MotionConfig reducedMotion="user">
          {size ? (
            <ToolApp lang={lang} frame={size} root={root} initialView={initialView} readQuery={readQuery} qa={qa} />
          ) : (
            <ToolShell lang={lang} />
          )}
        </MotionConfig>
      </ToolBoundary>
    </div>
  );
}

interface IAppProps {
  lang: TToolLang;
  frame: { w: number; h: number };
  root: HTMLDivElement | null;
  initialView?: TPanel;
  readQuery: boolean;
  qa: boolean;
}

function ToolApp({ lang, frame, root, initialView, readQuery, qa }: IAppProps) {
  const t: TT = useTranslations('tool.glance');
  const tf: TT = useTranslations('face');
  const tw: TT = useTranslations('tool.when');
  const snap = useWakeStill();
  const settings = useToolSettings();
  const ui = useToolUi();
  const pro = usePro();
  const presets = usePresets();
  const history = useHistory();
  const journey = useJourney();
  const online = useOnline();
  const low = useLowBattery();
  const fs = useFullscreen();
  const touch = useMediaQuery('(hover: none)');
  const calm = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    // Loaded after the first paint so the sign-in client never weighs on the tool's start.
    void import('@/lib/pro/client').then((m) => m.connectPro());
    markSeen();
  }, []);

  const W = frame.w;
  const H = frame.h;
  const device = deviceFor(W);
  const phone = device === 'phone';
  const tabP = device === 'tabletP';
  const tabL = device === 'tabletL';
  const desk = device === 'desktop';
  const narrow = phone || tabP;
  const faceTheme = resolvedTheme === 'light' ? 'light' : resolvedTheme === 'oled' ? 'oled' : 'dark';
  const night = faceTheme !== 'light';
  const themeChoice: TThemeChoice = theme === 'light' || theme === 'dark' || theme === 'oled' ? theme : 'auto';
  // Until a dial is picked the clock follows the language: 24-hour in German, Spanish, French and Portuguese.
  const fmt = settings.clockSet ? (settings.h12 ? 12 : 24) : localeDial(lang);
  const offset = ui.qa.offsetMs ?? 0;
  const st = snap.state;
  const live = isLive(st);
  const isSet = st === 'idle' || st === 'starting';
  const indef = live ? snap.endsAt === null : settings.totalSec === 0;
  const total = live || st === 'ended' ? snap.totalSec : settings.totalSec;
  const panel = ui.panel;
  const idleOn = (st === 'running' || st === 'fallback') && panel === 'none' && !settings.keepControls;
  const idle = useIdle(idleOn, { root, steady: calm });
  const hidden = ui.qa.controls === 'hidden' || idle.idle;
  const still = low || settings.motion === 'still';
  const late = useWakeValue((s) => isLate(secondsOfDay((s.now || Date.now()) + offset)));
  const dim = settings.dim && late;
  const reason = ui.qa.reason ?? reasonFor(snap, low);
  const qaBanner = ui.qa.banner && ui.qa.banner !== 'none' ? ui.qa.banner : null;
  const banner: TBannerKind | null =
    st === 'blocked' || st === 'unsupported' || st === 'fallback' || st === 'needsyou'
      ? st
      : (qaBanner ?? (snap.peerHolds ? 'conflict' : !online ? 'offline' : ui.update ? 'update' : null));

  const time = useCallback((ms: number) => clockTime(ms, lang, fmt), [lang, fmt]);
  // An end time, with "tomorrow" once it is past midnight.
  const until = useCallback(
    (ms: number) => clockUntil(ms, Date.now() + offset, lang, fmt, (at) => tw('tomorrow', { time: at })),
    [lang, fmt, offset, tw],
  );
  const dur = useCallback(
    (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.round((sec % 3600) / 60);
      if (!h) return `${Math.max(m, sec > 0 ? 1 : 0)} ${t('unit.min')}`;
      return m ? `${h} ${t('unit.h')} ${m} ${t('unit.min')}` : `${h} ${t('unit.h')}`;
    },
    [t],
  );
  // The same length in whole words ("15 minutes", "1 hour"), for sentences and spoken labels.
  const durLong = useCallback(
    (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.round((sec % 3600) / 60);
      if (!h) return t('long.min', { n: Math.max(m, sec > 0 ? 1 : 0) });
      return m ? `${t('long.hour', { n: h })} ${t('long.min', { n: m })}` : t('long.hour', { n: h });
    },
    [t],
  );
  const faceName = useCallback((face: unknown) => tf(`name.${glanceFace(face)}`), [tf]);

  const latest = useRef({ settings, until, durLong, faceName, t, presets });
  useEffect(() => {
    latest.current = { settings, until, durLong, faceName, t, presets };
  });

  const [announce, setAnnounce] = useState('');

  const a: IToolActions = useMemo(() => {
    const setLength = (sec: number) => {
      wake.setLength(sec);
      if (!isLive(wake.getSnapshot().state)) updateSettings({ totalSec: sec });
    };
    return {
      start: () => {
        const s = wake.getSnapshot().state;
        if (s === 'ended' || s === 'idle' || s === 'unsupported') wake.start(latest.current.settings.totalSec);
      },
      toggle: () => {
        const s = wake.getSnapshot().state;
        if (s === 'idle' || s === 'ended') wake.start(latest.current.settings.totalSec);
        else wake.toggle();
      },
      pause: () => wake.pause(),
      resume: () => wake.resume(),
      stop: () => wake.stop(),
      extend: (sec) => wake.extend(sec),
      shorten: (sec) => {
        const s = wake.getSnapshot();
        if (s.endsAt === null || !isLive(s.state)) return;
        if (remainSec(s) > sec + 60) wake.until(s.endsAt - sec * 1000);
      },
      undo: () => wake.undoExtend(),
      setLength,
      useFallback: () => {
        wake.useFallback();
        if (toolUi.get().panel === 'help') toolUi.close();
      },
      checkAgain: () => wake.checkAgain(),
      takeOver: () => wake.takeOver(),
      reload: () => window.location.reload(),
      open: (p) => toolUi.open(p),
      close: () => toolUi.close(),
      setFace: (face) => {
        updateSettings({ face });
        setAnnounce(latest.current.t('an.face', { face: latest.current.faceName(face) }));
      },
      setTheme: (choice) => {
        setTheme(choice === 'auto' ? 'system' : choice);
        updateSettings({ theme: choice });
      },
      setVibe: (vibe) => updateSettings({ vibe }),
      setMotion: (motion) => updateSettings({ motion }),
      applyPreset: (p) => {
        updateSettings({ face: p.face, ...(p.vibe ? { vibe: p.vibe } : {}) });
        setLength(p.totalSec);
        toolUi.close();
        const s = wake.getSnapshot().state;
        if (!isAwake(s)) {
          if (isLive(s)) wake.stop();
          wake.start(p.totalSec);
        }
      },
      savePreset: () => {
        const cur = latest.current;
        const p = savePreset({
          label: cur.settings.label,
          totalSec: cur.settings.totalSec,
          face: cur.settings.face,
          chime: cur.settings.chime !== 'off',
          vibe: cur.settings.vibe,
        });
        showNote(cur.t('recents.saved', { name: p.label }));
      },
      fullscreen: () => undefined,
      showControls: () => undefined,
      feedback: (rating) => toolUi.set({ panel: 'feedback', rating: rating ?? toolUi.get().rating }),
      quietNudge: () => quietNudge(),
      setLang: (code) => {
        const url = new URL(window.location.href);
        if (url.pathname.startsWith('/dev/')) {
          url.searchParams.set('lang', code);
          window.location.assign(url.toString());
        } else if (isLocale(code)) window.location.assign(localePath(code, '/'));
      },
      update: (patch: Partial<IToolSettings>) => updateSettings(patch),
    };
  }, [setTheme]);

  const actions: IToolActions = useMemo(
    () => ({
      ...a,
      fullscreen: () => {
        if (fs.toggle(root) && !fs.on) idle.rest();
      },
      showControls: () => idle.wake(),
    }),
    [a, fs, root, idle],
  );

  // First paint: the address options (?preset, ?face, ?vibe, ?autostart, ?until, ?open) and an optional first panel.
  // They are read once and taken off the address, so a reload or a copied link never applies them again.
  useEffect(() => {
    if (initialView) toolUi.open(initialView);
    if (!readQuery) return;
    const { pathname, search, hash, href } = window.location;
    const q = readToolQuery(search);
    const clean = stripToolQuery(href);
    if (clean !== `${pathname}${search}${hash}`) window.history.replaceState(null, '', clean);
    if (q.open) toolUi.open(q.open);
    if (q.face) updateSettings({ face: glanceFace(q.face) });
    if (q.vibe) updateSettings({ vibe: q.vibe });
    if (q.chime !== undefined) updateSettings({ chime: q.chime ? 'two' : 'off' });
    // A session that came back after a reload keeps its own length and end time.
    if (isLive(wake.getSnapshot().state)) return;
    if (q.totalSec !== undefined) {
      wake.setLength(q.totalSec);
      updateSettings({ totalSec: q.totalSec });
    }
    if (q.untilAt) wake.until(q.untilAt);
    else if (q.autostart) wake.start(q.totalSec ?? latest.current.settings.totalSec);
  }, [initialView, readQuery]);

  // A tap on the start button before the tool was ready starts the session now, once.
  useEffect(() => {
    const html = document.documentElement;
    if (!html.hasAttribute(START_QUEUED)) return;
    html.removeAttribute(START_QUEUED);
    const s = wake.getSnapshot().state;
    if (s === 'idle' || s === 'ended' || s === 'unsupported') wake.start(latest.current.settings.totalSec);
  }, []);

  useEffect(() => {
    const offs = [
      wake.on('extended', ({ sec, endsAt: end }) => {
        const l = latest.current;
        showExtended(
          l.t('toast.extended', { dur: l.durLong(sec), time: l.until(end + (toolUi.get().qa.offsetMs ?? 0)) }),
          l.t('toast.undo'),
          () => wake.undoExtend(),
        );
      }),
      wake.on('ended', () => {
        playChime(latest.current.settings.chime);
        if (firstDone()) toolUi.set({ first: true });
      }),
      wake.on('finished', (f) => {
        const l = latest.current.settings;
        if (f.awakeSec >= 60) countSession();
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
  }, []);

  // Leaving Time's up (a new start or a stop) puts the first-session card away for good.
  useEffect(() => {
    if (st !== 'ended' && toolUi.get().first && !ui.qa.first) toolUi.set({ first: false });
  }, [st, ui.qa.first]);

  // A new build announces itself; the banner offers a reload that keeps the session.
  useEffect(() => {
    const onUpdate = () => toolUi.set({ update: true });
    window.addEventListener(UPDATE_EVENT, onUpdate);
    const stop = watchForUpdate();
    return () => {
      window.removeEventListener(UPDATE_EVENT, onUpdate);
      stop();
    };
  }, []);

  // Resting controls are inert; focus left on one moves to the stage, so the keys keep working.
  useLayoutEffect(() => {
    const active = document.activeElement;
    if (hidden && root?.contains(active) && active?.closest('[data-rests]'))
      root.querySelector<HTMLElement>(`#${STAGE_ID}`)?.focus({ preventScroll: true });
  }, [hidden, root]);

  // Pro switching on during a visit opens the thank-you panel once.
  const wasPro = useRef(pro.isPro);
  useEffect(() => {
    if (pro.isPro && !wasPro.current) toolUi.open('proDone');
    wasPro.current = pro.isPro;
  }, [pro.isPro]);

  // Sound keeps playing while a hidden tab waits for its tap: the session is still running, and the mini clock that
  // opens over other windows controls it.
  const sounding = isAwake(st) || st === 'needsyou';
  useEffect(() => {
    setAmbient(pro.mix, sounding && settings.ambientOn);
  }, [sounding, pro.mix, settings.ambientOn]);

  // What a screen reader hears when the session changes.
  const lastAnnounce = useRef(0);
  useEffect(() => {
    const an = snap.announce;
    if (!an || an.id === lastAnnounce.current) return;
    lastAnnounce.current = an.id;
    const end = an.endsAt === null ? '' : until(an.endsAt + offset);
    const text: Record<typeof an.kind, string> = {
      start: end ? t('an.start', { time: end }) : t('an.startOpen'),
      extend: t('an.extend', { dur: durLong(an.extendSec), time: end }),
      lowtime: t('an.low'),
      hidden: t('an.hidden'),
      refused: t('an.refused', { reason: t(`reason.${reason}`) }),
      paused: snap.endsAt === null ? t('an.pausedOpen') : t('an.paused', { dur: dur(remainSec(wake.getSnapshot())) }),
      ended: t('an.ended'),
    };
    setAnnounce(text[an.kind]);
  }, [snap, until, dur, durLong, t, offset, reason]);

  const g: IGlance = {
    lang,
    t,
    fmt,
    device,
    phone,
    tabP,
    tabL,
    desk,
    narrow,
    touch,
    W,
    H,
    night,
    faceTheme,
    themeChoice,
    settings,
    ui,
    presets,
    history,
    pro,
    journey,
    st,
    isSet,
    hidden,
    still,
    dim,
    fullscreen: fs.on,
    canFullscreen: fs.can,
    panel,
    total,
    indef,
    offset,
    startedAt: snap.startedAt,
    endedAt: snap.endedAt,
    checkedAt: snap.checkedAt ?? null,
    face: glanceFace(settings.face),
    reason,
    banner,
    topH: phone ? 64 : 76,
    dockH: phone ? DOCK_H.phone : DOCK_H.wide,
    root,
    time,
    until,
    dur,
    durLong,
    faceName,
    tf,
    a: actions,
  };

  useKeys(g);

  const due = useWakeValue((s) =>
    nudgeDue(journey, presets.length, pro.devices.length, (s.now || Date.now()) + offset),
  );
  const nudge =
    st === 'running' && panel === 'none' && !hidden && (ui.qa.nudge === true || (ui.qa.nudge === undefined && due));
  const assertive =
    st === 'blocked' && announce !== '' && announce === t('an.refused', { reason: t(`reason.${reason}`) });

  return (
    <ToolContext.Provider value={g}>
      <Backdrop
        night={night}
        narrow={narrow}
        topH={g.topH}
        vibe={settings.vibe}
        motion={settings.motion}
        still={still}
        dim={dim}
        state={st}
      />
      <TopBar />
      <Banner />
      <Stage />
      <Dock />
      <TopPlaces />
      <ControlsHint />
      {nudge ? (
        <Nudge sessions={ui.qa.nudge ? 12 : journey.sessions} presets={ui.qa.nudge ? 2 : presets.length} />
      ) : null}
      <ToolToaster bottom={g.dockH + (phone ? DOCK_BOTTOM.phone + 12 : DOCK_BOTTOM.wide + 16)} />
      <LazyPanels />
      <LazyPalette />
      <Surfaces />
      <TabTitle />
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
