'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MiniClock } from '@/components/pip/mini-clock';
import { pipKeys, useCloseWithSession, useOwnLock } from '@/components/pip/pip-launcher';
import { toFaceId } from '@/components/face';
import { useToolSettings } from '@/lib/tool/settings';
import { useFaceTheme, useMounted, useWindowNow } from '@/lib/surfaces/hooks';
import { joinMirror, type IMirror } from '@/lib/surfaces/mirror';
import { surfaceView } from '@/lib/surfaces/session';
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
// It draws only in the browser, since its clock and session come from the opening tab.
export function PipPage() {
  const t = useTranslations('surfaces.pip');
  const locale = useLocale();
  const { h12, face } = useToolSettings();
  const theme = useFaceTheme();
  const mounted = useMounted();
  const now = useWindowNow(null);
  const [mirror, setMirror] = useState<IMirror | null>(null);
  const [, setHeard] = useState(0);

  useEffect(() => {
    const m = joinMirror(() => setHeard((n) => n + 1));
    setMirror(m);
    return () => m.dispose();
  }, []);

  const snap = mirror?.snap(now) ?? { ...IDLE, now };
  const live = isLive(snap.state);
  const held = useOwnLock(mounted ? window : null, live && snap.pausedAt === null);
  const view = surfaceView(snap, { held, locale, fmt: h12 ? 12 : 24 });
  const close = useCallback(() => window.close(), []);
  useCloseWithSession(live, close);

  useEffect(
    () =>
      pipKeys(
        window,
        () => mirror?.send('stop'),
        () => window.close(),
      ),
    [mirror],
  );

  return (
    <>
      <h1 className="sr-only">{t('title')}</h1>
      {mounted ? <MiniClock view={view} theme={theme} face={toFaceId(face)} windowed onClose={close} /> : null}
    </>
  );
}
