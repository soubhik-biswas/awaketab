'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toFaceId } from '@/components/face';
import { useFaceTheme, useWindowNow } from '@/lib/surfaces/hooks';
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

// Keeps the installed app's widgets in step with this tab and carries out their taps (through the service worker).
export function WidgetSync() {
  const t = useTranslations('surfaces');
  const locale = useLocale();
  const { h12, label } = useToolSettings();
  const snap = useWake();
  const line = useSurfaceLine();
  const minute = Math.floor(useWindowNow(null) / 60_000);
  const view = surfaceView({ ...snap, now: minute * 60_000 || snap.now }, { locale, fmt: h12 ? 12 : 24 });
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

  return null;
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
