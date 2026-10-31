'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MotionConfig } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useMediaQuery } from 'usehooks-ts';
import { ToolSurfaces } from '@/components/pip/tool-surfaces';
import { isLocale, localePath } from '@/i18n/locales';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/format';
import { clockTime, secondsOfDay } from '@/lib/tool/clock';
import { faceLabel, glanceFace } from '@/lib/tool/collections';
import { addHistory, useHistory } from '@/lib/tool/history';
import { countSession, firstDone, markSeen, nudgeDue, quietNudge, useJourney } from '@/lib/tool/journey';
import { iconForLabel, savePreset, usePresets } from '@/lib/tool/presets';
import { usePro } from '@/lib/tool/pro';
import { readToolQuery } from '@/lib/tool/share';
import { playChime, setAmbient } from '@/lib/tool/sound';
import { updateSettings, useToolSettings, type IToolSettings, type TThemeChoice } from '@/lib/tool/settings';
import type { TToolLang } from '@/lib/tool/strings';
import { toolUi, useToolUi, type TBlockReason, type TDevice, type TPanel } from '@/lib/tool/ui';
import { elapsedSec, isAwake, isLive, remainSec, useWake, wake, type IWakeSnapshot } from '@/lib/wake';
import { useOnline } from '@/hooks/use-online';
import { Backdrop } from './backdrop';
import { Banner } from './banner';
import { ToolContext, type IGlance, type IToolActions, type TBannerKind, type TT } from './context';
import { Dock } from './dock';
import { useFrame, useFullscreen, useIdle, useLowBattery } from './hooks';
import { useKeys } from './keys';
import { ControlsHint, Nudge, showExtended, showNote, ToolToaster } from './overlays';
import { Panels } from './panels';
import { Palette } from './palette';
import { Stage } from './stage';
import { TopBar } from './top-bar';
import './glance.css';

const QaBridge = dynamic(() => import('./qa-bridge').then((m) => m.QaBridge), { ssr: false });

export interface IToolProps {
  lang?: TToolLang;
  initialView?: TPanel;
  // Kept for older callers: the tool opens straight onto the working timer, with no welcome step.
  welcome?: boolean;
  readQuery?: boolean;
  qa?: boolean;
  className?: string;
}

// The handoff's layout tiers: desktop from 1300, tablet landscape from 1100, tablet portrait from 700.
function deviceFor(w: number): TDevice {
  if (w >= 1300) return 'desktop';
  if (w >= 1100) return 'tabletL';
  if (w >= 700) return 'tabletP';
  return 'phone';
}

function reasonFor(snap: IWakeSnapshot, low: boolean): TBlockReason {
  if (snap.advice === 'insecure_context') return 'insecure';
  if (snap.advice === 'permissions_policy' || snap.advice === 'iframe_no_allow') return 'policy';
  return low ? 'battery' : 'unknown';
}

// The tool: the home page's first screen. It measures its own frame and lays out to the device tier it finds, so it
// renders nothing on the server and never reads the window during render.
export function Tool({ lang = 'en', initialView, readQuery = true, qa = false, className }: IToolProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const attach = useCallback((el: HTMLDivElement | null) => {
    ref.current = el;
    setRoot(el);
  }, []);
  const size = useFrame(ref);
  const snap = useWake();
  return (
    <div
      ref={attach}
      lang={lang}
      data-slot="tool"
      data-state={snap.state}
      className={cn('relative h-dvh w-full overflow-hidden font-sans', className)}
    >
      <MotionConfig reducedMotion="user">
        {size ? (
          <ToolApp lang={lang} frame={size} root={root} initialView={initialView} readQuery={readQuery} qa={qa} />
        ) : null}
      </MotionConfig>
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
  const snap = useWake();
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
  const fmt = settings.h12 ? 12 : 24;
  const offset = ui.qa.offsetMs ?? 0;
  const now = (snap.now || Date.now()) + offset;
  const st = snap.state;
  const live = isLive(st);
  const isSet = st === 'idle' || st === 'starting';
  const indef = live ? snap.endsAt === null : settings.totalSec === 0;
  const total = live || st === 'ended' ? snap.totalSec : settings.totalSec;
  const remain = live ? (indef ? elapsedSec(snap) : remainSec(snap)) : st === 'ended' ? 0 : total;
  const endsAt = now + (indef ? 0 : remain) * 1000;
  const panel = ui.panel;
  const idleOn = (st === 'running' || st === 'fallback') && panel === 'none';
  const idle = useIdle(idleOn);
  const hidden = ui.qa.controls === 'hidden' || idle.idle;
  const still = low || settings.motion === 'still';
  const reason = ui.qa.reason ?? reasonFor(snap, low);
  const qaBanner = ui.qa.banner && ui.qa.banner !== 'none' ? ui.qa.banner : null;
  const banner: TBannerKind | null =
    st === 'blocked' || st === 'unsupported' || st === 'fallback' || st === 'needsyou'
      ? st
      : (qaBanner ?? (snap.peerHolds ? 'conflict' : !online ? 'offline' : ui.update ? 'update' : null));

  const time = useCallback((ms: number) => clockTime(ms, lang, fmt), [lang, fmt]);
  const dur = useCallback(
    (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.round((sec % 3600) / 60);
      if (!h) return `${Math.max(m, sec > 0 ? 1 : 0)} ${t('unit.min')}`;
      return m ? `${h} ${t('unit.h')} ${m} ${t('unit.min')}` : `${h} ${t('unit.h')}`;
    },
    [t],
  );

  const latest = useRef({ settings, snap, time, dur, t, presets });
  useEffect(() => {
    latest.current = { settings, snap, time, dur, t, presets };
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
        setAnnounce(latest.current.t('an.face', { face: faceLabel(face) }));
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
        fs.toggle(root);
        if (!fs.on) idle.rest();
      },
      showControls: () => idle.wake(),
    }),
    [a, fs, root, idle],
  );

  // First paint: the address options (?preset, ?face, ?vibe, ?autostart, ?until) and an optional first panel.
  useEffect(() => {
    if (initialView) toolUi.open(initialView);
    if (!readQuery) return;
    const q = readToolQuery(window.location.search);
    if (q.face) updateSettings({ face: glanceFace(q.face) });
    if (q.vibe) updateSettings({ vibe: q.vibe });
    if (q.chime !== undefined) updateSettings({ chime: q.chime ? 'two' : 'off' });
    if (q.totalSec !== undefined) {
      wake.setLength(q.totalSec);
      updateSettings({ totalSec: q.totalSec });
    }
    if (q.untilAt) wake.until(q.untilAt);
    else if (q.autostart) wake.start(q.totalSec ?? latest.current.settings.totalSec);
  }, [initialView, readQuery]);

  useEffect(() => {
    const offs = [
      wake.on('extended', ({ sec, endsAt: end }) => {
        const l = latest.current;
        showExtended(
          l.t('toast.extended', { dur: l.dur(sec), time: l.time(end + (toolUi.get().qa.offsetMs ?? 0)) }),
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
    window.addEventListener('awaketab:update', onUpdate);
    return () => window.removeEventListener('awaketab:update', onUpdate);
  }, []);

  // Pro switching on during a visit opens the thank-you panel once.
  const wasPro = useRef(pro.isPro);
  useEffect(() => {
    if (pro.isPro && !wasPro.current) toolUi.open('proDone');
    wasPro.current = pro.isPro;
  }, [pro.isPro]);

  const awake = isAwake(st);
  useEffect(() => {
    setAmbient(pro.mix, awake && settings.ambientOn);
  }, [awake, pro.mix, settings.ambientOn]);

  // The tab title is live: "59:12 left · AwakeTab".
  const baseTitle = useRef<string | null>(null);
  useEffect(() => {
    baseTitle.current ??= document.title;
    const base = 'AwakeTab';
    let title = baseTitle.current;
    if (awake && !indef)
      title = `${t('tab.left', { t: settings.secs ? formatDuration(remain) : dur(remain) })} · ${base}`;
    else if (awake) title = `${t('tab.awake')} · ${base}`;
    else if (st === 'paused' || st === 'needsyou') title = `${t('tab.paused')} · ${base}`;
    else if (st === 'blocked') title = `${t('tab.blocked')} · ${base}`;
    else if (st === 'ended') title = `${t('tab.up')} · ${base}`;
    document.title = title;
  }, [awake, indef, remain, st, settings.secs, t, dur]);

  // What a screen reader hears when the session changes.
  const lastAnnounce = useRef(0);
  useEffect(() => {
    const an = snap.announce;
    if (!an || an.id === lastAnnounce.current) return;
    lastAnnounce.current = an.id;
    const end = an.endsAt === null ? '' : time(an.endsAt + offset);
    const text: Record<typeof an.kind, string> = {
      start: end ? t('an.start', { time: end }) : t('an.startOpen'),
      extend: t('an.extend', { dur: dur(an.extendSec), time: end }),
      lowtime: t('an.low'),
      hidden: t('an.hidden'),
      refused: t('an.refused', { reason: t(`reason.${reason}`) }),
      paused: t('an.paused', { dur: dur(remainSec(snap)) }),
      ended: t('an.ended'),
    };
    setAnnounce(text[an.kind]);
  }, [snap, time, dur, t, offset, reason]);

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
    snap,
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
    fullscreen: fs.on,
    panel,
    total,
    remain,
    indef,
    now,
    nowSec: secondsOfDay(now),
    endsAt,
    face: glanceFace(settings.face),
    reason,
    banner,
    topH: phone ? 64 : 76,
    dockH: phone ? 136 : 80,
    root,
    time,
    dur,
    a: actions,
  };

  useKeys(g);

  const nudge =
    st === 'running' &&
    panel === 'none' &&
    !hidden &&
    (ui.qa.nudge === true || (ui.qa.nudge === undefined && nudgeDue(journey, presets.length, pro.devices.length, now)));
  const assertive =
    st === 'blocked' && announce !== '' && announce === t('an.refused', { reason: t(`reason.${reason}`) });

  return (
    <ToolContext.Provider value={g}>
      <Backdrop
        W={W}
        H={H}
        night={night}
        narrow={narrow}
        topH={g.topH}
        vibe={settings.vibe}
        motion={settings.motion}
        still={still}
        state={st}
      />
      <TopBar />
      <Banner />
      <Stage />
      <Dock />
      <ControlsHint />
      {nudge ? (
        <Nudge sessions={ui.qa.nudge ? 12 : journey.sessions} presets={ui.qa.nudge ? 2 : presets.length} />
      ) : null}
      <ToolToaster bottom={g.dockH + (phone ? 28 : 44)} />
      <Panels />
      <Palette />
      <ToolSurfaces />
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
