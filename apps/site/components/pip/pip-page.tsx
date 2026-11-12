'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MiniView, type IMiniActions } from '@/components/pip/mini-view';
import { miniDial, miniLang, pipKeys, useCloseOnStop, useOwnLock } from '@/components/pip/pip-launcher';
import { toFaceId } from '@/components/face';
import { useToolSettings } from '@/lib/tool/settings';
import { useFaceTheme, useMounted, useWindowNow } from '@/lib/surfaces/hooks';
import { joinMirror, type IMirror } from '@/lib/surfaces/mirror';
import { focusTab, readMiniSize, resizeMini, saveMiniSize, type TMiniSize } from '@/lib/surfaces/pip';
import { EXTEND_SEC, surfaceView } from '@/lib/surfaces/session';
import { isLive } from '@/lib/wake';

const IDLE = {
  state: 'idle',
  totalSec: 3600,
  endsAt: null,
  pausedAt: null,
  pauseReason: null,
  endedAt: null,
  mode: null,
} as const;

// The popup fallback at /pip: the mini clock mirrors the AwakeTab tab that opened it and holds its own wake lock.
// The mirror carries add and stop only, so pause, resume and sound stay in the tab. It draws only in the browser,
// since its clock and session come from the opening tab.
export function PipPage() {
  const t = useTranslations('surfaces.pip');
  const locale = useLocale();
  const settings = useToolSettings();
  const theme = useFaceTheme();
  const mounted = useMounted();
  const now = useWindowNow(null);
  const [mirror, setMirror] = useState<IMirror | null>(null);
  const [, setHeard] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [size, setSize] = useState<TMiniSize>(() => (typeof window === 'undefined' ? 'expanded' : readMiniSize()));

  useEffect(() => {
    const m = joinMirror(() => setHeard((n) => n + 1));
    setMirror(m);
    return () => m.dispose();
  }, []);

  const snap = mirror?.snap(now) ?? { ...IDLE, now };
  const live = isLive(snap.state);
  const held = useOwnLock(mounted ? window : null, live && snap.pausedAt === null, attempt);
  const lang = miniLang(locale);
  const fmt = miniDial(settings, lang);
  const view = surfaceView(snap, { held, locale, fmt });
  const close = useCallback(() => window.close(), []);
  useCloseOnStop(snap.state, close);
  useEffect(() => pipKeys(window, { close }), [close]);

  const onSize = (next: TMiniSize) => {
    setSize(next);
    saveMiniSize(next);
    resizeMini(window, next);
  };
  const actions: IMiniActions = {
    extend: () => mirror?.send('add', EXTEND_SEC * 1000),
    stop: () => mirror?.send('stop'),
    retry: mounted && 'wakeLock' in navigator ? () => setAttempt((n) => n + 1) : undefined,
    back: () => focusTab(window.opener),
  };

  return (
    <>
      <h1 className="sr-only">{t('title')}</h1>
      {mounted ? (
        <MiniView
          view={view}
          theme={theme}
          face={toFaceId(settings.face)}
          lang={lang}
          fmt={fmt}
          now={now}
          size={size}
          onSize={onSize}
          actions={actions}
          className="h-dvh w-screen"
        />
      ) : null}
    </>
  );
}
