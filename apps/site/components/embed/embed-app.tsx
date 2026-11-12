'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { createWakeLock } from '@awaketab/wake';
import {
  EmbedWidget,
  KitchenTimers,
  type TEmbedAction,
  type TEmbedNotice,
  type TEmbedReason,
} from '@/components/embed/embed-widget';
import { formatFullDate, formatTime } from '@/lib/format';
import { createBridge, type IBridge } from '@/lib/embed/bridge';
import { formatClock } from '@/lib/embed/clock';
import { fetchEmbedConfig, onAccent, type IEmbedConfig } from '@/lib/embed/config';
import { EmbedEngine, elapsedMs, isRunning, planEnd, presetMs, remainingMs } from '@/lib/embed/engine';
import { embedAdvice, inIframe, wakeLockPolicy } from '@/lib/embed/policy';
import {
  EMBED_NARROW,
  EMBED_VERSION,
  parseEmbedQuery,
  type IEmbedParams,
  type TEmbedTheme,
} from '@/lib/embed/protocol';
import { addTimer, readTimers, safeStorage, settleTimers, writeTimers, type ICookTimer } from '@/lib/embed/timers';
import { useWindowNow } from '@/lib/surfaces/hooks';
import { playChime } from '@/lib/tool/sound';

// What a compact frame spends beside the pill's words: its padding and border, the Start button with its gap, and
// the pill's own dot and padding.
const COMPACT_CHROME = 184;

function useScheme(): 'light' | 'dark' {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    () => 'light',
  );
}

// The iframe app at /embed/cook: the widget, its own wake engine, the postMessage bridge to the host page and the
// licence lookup by the verified parent hostname.
export function EmbedApp() {
  const t = useTranslations('embed');
  const ts = useTranslations('surfaces.embed');
  const tAdvice = useTranslations('tool.advice');
  const tl = useTranslations('surfaces');
  const locale = useLocale();
  const [params, setParams] = useState<IEmbedParams | null>(null);
  const [theme, setTheme] = useState<TEmbedTheme>('auto');
  const [cfg, setCfg] = useState<IEmbedConfig | null>(null);
  const [timers, setTimers] = useState<ICookTimer[]>([]);
  const [long, setLong] = useState(false);
  const [said, setSaid] = useState('');
  const engine = useMemo(() => new EmbedEngine(() => createWakeLock()), []);
  const snap = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  const scheme = useScheme();
  const now = useWindowNow(null);
  const root = useRef<HTMLDivElement | null>(null);
  const bridge = useRef<IBridge | null>(null);
  const policy = useRef<boolean | null>(null);

  useEffect(() => {
    const p = parseEmbedQuery(window.location.search);
    setParams(p);
    setTheme(p.theme);
    policy.current = wakeLockPolicy(document);
    const store = safeStorage(window);
    if (p.mode === 'cook' && p.size === 'full') setTimers(readTimers(store));
    const b = createBridge(window, p.host, (cmd) => {
      if (cmd.type === 'awaketab:stop') engine.stop();
      else if (cmd.type === 'awaketab:theme') setTheme(cmd.theme);
      else void engine.start(planEnd(p, Date.now(), cmd), true);
    });
    bridge.current = b;
    void fetchEmbedConfig(b.host).then((c) => {
      setCfg(c);
      if (p.theme === 'auto' && c.scheme && c.scheme !== 'auto') setTheme(c.scheme);
    });
    b.post({ type: 'awaketab:ready', version: EMBED_VERSION });
    return () => {
      b.dispose();
      engine.destroy();
    };
  }, [engine]);

  useEffect(() => {
    if (!params) return;
    const s = snap.session;
    bridge.current?.post({
      type: 'awaketab:state',
      lock: snap.lock,
      status: s ? (s.pausedAt !== null ? 'paused' : 'active') : 'inactive',
      endsAt: s?.endsAt ?? null,
      mode: params.mode,
    });
  }, [snap.lock, snap.session, params]);

  // The pill takes its own row in a compact frame that is narrow, or whose words do not fit beside the button.
  const fitPill = useCallback(() => {
    const el = root.current;
    if (!el || !params) return;
    const w = el.clientWidth;
    const words = el.querySelector<HTMLElement>('[data-pill-words]');
    const tight = w < EMBED_NARROW.compact[0] || (words !== null && words.scrollWidth > w - COMPACT_CHROME);
    setLong(params.size === 'compact' && w > 0 && tight);
  }, [params]);

  const endsAt = snap.session?.endsAt ?? null;
  useEffect(() => {
    fitPill();
    void document.fonts.ready.then(fitPill);
  }, [fitPill, snap.lock, endsAt, locale]);

  useEffect(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver === 'undefined' || !params) return;
    let last = 0;
    const ro = new ResizeObserver(() => {
      fitPill();
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0 && h !== last) {
        last = h;
        bridge.current?.post({ type: 'awaketab:resize', height: h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [params, fitPill]);

  useEffect(() => {
    const { list, done } = settleTimers(timers, now);
    if (done.length === 0) return;
    setTimers(list);
    writeTimers(safeStorage(window), list);
    playChime('bell');
    setSaid(done.map((x) => ts('timers.done', { name: x.name })).join(' '));
  }, [now, timers, ts]);

  useEffect(() => engine.onEnded(() => playChime('two')), [engine]);

  if (!params) return <div ref={root} className="min-h-[104px]" />;

  const s = snap.session;
  const running = isRunning(snap.lock);
  const busy = s !== null || snap.lock === 'requesting';
  const action: TEmbedAction = busy ? 'stop' : snap.lock === 'denied' ? 'retry' : 'start';
  const paused = s?.pausedAt != null;
  const clockMode = params.mode === 'clock';
  const ms = s ? (s.endsAt === null ? elapsedMs(s, now) : (remainingMs(s, now) ?? 0)) : presetMs(params, now);
  const digits = clockMode ? formatTime(now, locale) : formatClock(ms);
  const muted = !running || paused;
  const framed = inIframe(window);
  const advice =
    framed && policy.current === false
      ? 'iframe_no_allow'
      : snap.lock === 'denied'
        ? (embedAdvice(snap.advice, policy.current) ?? 'unknown')
        : snap.lock === 'unsupported'
          ? snap.tapNeeded
            ? 'tap'
            : (snap.advice ?? 'unsupported_browser')
          : null;
  const notice: TEmbedNotice = advice
    ? {
        tone: advice === 'iframe_no_allow' || snap.lock === 'denied' ? 'bad' : 'lamp',
        text:
          advice === 'iframe_no_allow'
            ? t('advice.iframe_no_allow')
            : advice === 'tap'
              ? t('advice.tapToStart')
              : tAdvice(advice),
        fix: advice === 'iframe_no_allow',
      }
    : null;
  let reason: TEmbedReason = 'unknown';
  if (advice === 'iframe_no_allow' || advice === 'permissions_policy') reason = 'policy';
  else if (advice === 'insecure_context') reason = 'insecure';
  const cook = params.mode === 'cook';
  const hint =
    snap.lock === 'requesting'
      ? t('meta.requesting')
      : snap.lock === 'denied' && !busy
        ? ''
        : !busy
          ? clockMode
            ? t('meta.clock')
            : t('advice.tapToStart')
          : cook
            ? paused
              ? t('cook.resume')
              : t('cook.pause')
            : s?.endsAt
              ? tl('line.until', { time: formatTime(s.endsAt, locale) })
              : t('meta.since', { time: formatTime(s?.startedAt ?? now, locale) });
  const digitsLabel = clockMode
    ? t('digits.clock', { time: digits })
    : cook && busy
      ? paused
        ? t('digits.resume', { time: digits })
        : t('digits.pause', { time: digits })
      : t('digits.start', { time: digits });
  const note =
    params.mode === 'minimal'
      ? t(busy ? (params.size === 'compact' ? 'minimal.liveShort' : 'minimal.live') : 'minimal.idle')
      : null;
  const shown = theme === 'auto' ? scheme : theme;

  const start = () => void engine.start(planEnd(params, Date.now()));
  const onAction = () => (busy ? engine.stop() : start());
  const onDigits = () => {
    if (!cook) {
      if (!busy) start();
      return;
    }
    if (s) engine.togglePause();
    else start();
  };
  const store = () => safeStorage(window);
  const timerBlock =
    cook && params.size === 'full' ? (
      <KitchenTimers
        timers={timers}
        now={now}
        format={formatClock}
        onAdd={(minutes) => {
          const next = addTimer(
            timers,
            minutes,
            ts('timers.default', { minutes }),
            Date.now(),
            crypto.randomUUID().slice(0, 8),
          );
          setTimers(next);
          writeTimers(store(), next);
          if (!busy) start();
        }}
        onRemove={(id) => {
          const next = timers.filter((x) => x.id !== id);
          setTimers(next);
          writeTimers(store(), next);
        }}
      />
    ) : undefined;

  return (
    <div ref={root} className="w-full">
      <EmbedWidget
        mode={params.mode}
        size={params.size}
        theme={shown}
        lock={snap.lock}
        action={action}
        digits={digits}
        muted={muted}
        digitsLabel={digitsLabel}
        hint={hint}
        foot={clockMode ? formatFullDate(now, locale) : t('foot')}
        note={note}
        notice={notice}
        paused={paused}
        until={s?.endsAt ? formatTime(s.endsAt, locale) : null}
        reason={reason}
        long={long}
        accent={cfg?.accent ? { bg: cfg.accent, fg: onAccent(cfg.accent) } : null}
        timers={timerBlock}
        onAction={onAction}
        onDigits={onDigits}
      />
      <span className="sr-only" role="status" aria-live="polite">
        {said}
      </span>
    </div>
  );
}
