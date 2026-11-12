'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toFaceId } from '@/components/face';
import { useWakeStill } from '@/components/tool/hooks';
import { clockDial } from '@/lib/clock-format';
import { useFaceTheme } from '@/lib/surfaces/hooks';
import { EXTEND_SEC, shortDuration, surfaceView } from '@/lib/surfaces/session';
import {
  postWidgetData,
  presetSeconds,
  readWidgetAction,
  widgetData,
  WIDGET_PRESETS,
  type IWidgetData,
  type TWidgetAction,
} from '@/lib/surfaces/widgets';
import { useToolSettings } from '@/lib/tool/settings';
import { useWake, wake } from '@/lib/wake';
import { useSurfaceLine } from '@/components/pip/mini-clock';
import { WidgetLarge, WidgetQuickStart, WidgetScreen, WidgetSmall } from './widget-tiles';

const QUICK = WIDGET_PRESETS[0];

function runWidgetAction(a: TWidgetAction): void {
  if (a.action === 'extend') wake.extend(EXTEND_SEC);
  else if (a.action === 'stop') wake.stop();
  else if (a.action === 'preset') {
    const sec = presetSeconds(a.preset);
    if (sec !== null) {
      wake.stop();
      wake.start(sec);
    }
  }
}

const watchWorker = (cb: () => void) => {
  const sw = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker;
  sw?.addEventListener('controllerchange', cb);
  return () => sw?.removeEventListener('controllerchange', cb);
};

// Widgets are fed through the service worker, so a page no worker controls has nobody to tell.
function useWidgetHost(): boolean {
  return useSyncExternalStore(
    watchWorker,
    () => 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null,
    () => false,
  );
}

// The widgets read to the minute, so the clock here turns once a minute, on the minute.
function useMinute(): number {
  const [minute, setMinute] = useState(() => Math.floor(Date.now() / 60_000));
  useEffect(() => {
    let id = 0;
    const tick = () => {
      setMinute(Math.floor(Date.now() / 60_000));
      id = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 5);
    };
    id = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 5);
    return () => window.clearTimeout(id);
  }, []);
  return minute;
}

function WidgetFeed() {
  const t = useTranslations('surfaces');
  const locale = useLocale();
  const { h12, clockSet, label } = useToolSettings();
  const snap = useWakeStill();
  const line = useSurfaceLine();
  const minute = useMinute();
  const fmt = clockDial(locale, clockSet ? !h12 : null);
  const view = surfaceView({ ...snap, now: minute * 60_000 }, { locale, fmt });
  const json = JSON.stringify(
    widgetData(view, {
      status: t(`status.${view.label}`),
      pill:
        view.awake && !view.indef
          ? t('widgets.left', { dur: shortDuration(view.remain, t) })
          : t(`status.${view.label}`),
      line: line(view),
      ends: view.awake && view.until ? t('widgets.ends', { time: view.until }) : line(view),
      label: label || t('widgets.name'),
      quick: t('widgets.quick'),
      extend: t('widgets.extend'),
      stop: t('widgets.stop'),
      presetsTitle: t('widgets.presets'),
      presets: WIDGET_PRESETS.map((p) => ({ name: t(`widgets.${p.key}`), length: t(`widgets.${p.len}`) })),
    }),
  );

  useEffect(() => {
    postWidgetData(JSON.parse(json) as IWidgetData);
  }, [json]);

  return null;
}

// Keeps the installed app's widgets in step with this tab and carries out their taps (through the service worker).
// The feed and its clock run only while a service worker is there to pass the data on.
export function WidgetSync() {
  const hosted = useWidgetHost();

  useEffect(() => {
    const sw = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker;
    if (!sw) return;
    const onMessage = (ev: MessageEvent<unknown>) => {
      const a = readWidgetAction(ev.data);
      if (a) runWidgetAction(a);
    };
    sw.addEventListener('message', onMessage);
    return () => sw.removeEventListener('message', onMessage);
  }, []);

  return hosted ? <WidgetFeed /> : null;
}

// The three widgets on their home-screen frame, live from the engine, for previews and the dev board.
export function LiveWidgets({ className }: { className?: string }) {
  const locale = useLocale();
  const { h12, label, face } = useToolSettings();
  const snap = useWake();
  const theme = useFaceTheme();
  const view = surfaceView(snap, { locale, fmt: h12 ? 12 : 24 });
  const tile = theme === 'light' ? 'dark' : theme;
  return (
    <WidgetScreen className={className}>
      <WidgetLarge
        view={view}
        theme={tile}
        face={toFaceId(face)}
        label={label}
        onExtend={() => wake.extend(EXTEND_SEC)}
      />
      <WidgetSmall view={view} theme={tile} face={toFaceId(face)} />
      <WidgetQuickStart onStart={() => QUICK && runWidgetAction({ action: 'preset', preset: QUICK.preset })} />
    </WidgetScreen>
  );
}
