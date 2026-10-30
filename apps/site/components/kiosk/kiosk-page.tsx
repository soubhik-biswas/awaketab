'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import screenfull from 'screenfull';
import { createStorage, verifyLicenseToken, type ILicenseRecord } from '@awaketab/core';
import { faceName } from '@/components/face';
import { Chip } from '@/components/product/chip';
import { showToast } from '@/components/product/toasts';
import { Button } from '@/components/ui/button';
import { KioskScreen } from '@/components/kiosk/kiosk-screen';
import { formatTime, formatUntil, secondsSinceMidnight } from '@/lib/format';
import { useWindowNow } from '@/lib/surfaces/hooks';
import {
  applyKioskHash,
  DRIFT_MS,
  kioskQuery,
  kioskWindow,
  KIOSK_FACES,
  KIOSK_SCREENS,
  licenceAllows,
  parseKioskQuery,
  type IKioskConfig,
  type IKioskSchedule,
} from '@/lib/surfaces/kiosk';
import { surfaceView, type ISurfaceView } from '@/lib/surfaces/session';
import { useToolSettings } from '@/lib/tool/settings';
import { isLive, useWake, wake } from '@/lib/wake';

const LABEL = 'font-mono text-[12px] tracking-[.1em] text-muted-foreground-strong';
const CARD =
  'flex flex-col gap-1.5 rounded-[16px] bg-card p-[14px] text-[14px] leading-[1.5] shadow-[0_0_0_1px_var(--border)]';
const CHIP = 'px-[14px] aria-pressed:border aria-pressed:font-semibold';

function wallToday(wall: string, now: number): number {
  const [h, m] = wall.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.getTime();
}

// What the preview draws: the kiosk as it will run, counting down to the end of the schedule's window.
function previewView(schedule: IKioskSchedule | null, now: number): ISurfaceView {
  const w = kioskWindow(schedule, now);
  const length = schedule
    ? ((wallToday(schedule.to, now) - wallToday(schedule.from, now)) / 1000 + 86_400) % 86_400 || 86_400
    : 0;
  const remain = w.inside && w.end !== null ? Math.ceil((w.end - now) / 1000) : length;
  return {
    wake: 'running',
    face: 'running',
    label: 'awake',
    tone: 'lamp',
    solid: true,
    live: true,
    awake: true,
    canExtend: false,
    remain,
    total: Math.max(remain, length),
    indef: schedule === null,
    nowSec: secondsSinceMidnight(now),
    endsAt: null,
    until: null,
    endedAt: null,
  };
}

// Keeps the screen awake inside the schedule's window and lets it sleep outside it, while kiosk mode runs; it checks
// again every half minute and whenever the session changes.
function useKioskWake(running: boolean, schedule: IKioskSchedule | null, now: number) {
  const snap = useWake();
  const minute = Math.floor(now / 30_000);
  useEffect(() => {
    if (!running) return;
    const w = kioskWindow(schedule, Date.now());
    const live = isLive(snap.state);
    if (!w.inside) {
      if (live) wake.stop();
      return;
    }
    if (w.end === null) {
      if (!live) wake.start(0);
      return;
    }
    if (!live || snap.endsAt === null || Math.abs(snap.endsAt - w.end) > 1000) wake.until(w.end);
  }, [running, schedule, minute, snap.state, snap.endsAt]);
  return snap;
}

export function KioskPage() {
  const t = useTranslations('surfaces.kiosk');
  const locale = useLocale();
  const { h12 } = useToolSettings();
  const fmt = h12 ? 12 : 24;
  const defaults = useMemo(() => ({ kicker: t('kicker'), msg: t('headline'), line: t('line') }), [t]);
  const [config, setConfig] = useState<IKioskConfig>(() => parseKioskQuery('', defaults));
  const [running, setRunning] = useState(false);
  const [shift, setShift] = useState(0);
  const [licence, setLicence] = useState<ILicenseRecord | null>(null);
  const loaded = useRef(false);
  const now = useWindowNow(null);
  const snap = useKioskWake(running, config.schedule, now);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const store = createStorage();
    setConfig(parseKioskQuery(window.location.search, defaults));
    setLicence(store.license());
    if (new URLSearchParams(window.location.search).get('kiosk') === '1') setRunning(true);
    void applyKioskHash(
      window.location.hash,
      (token) => verifyLicenseToken(token, { deviceId: '' }),
      (record) => {
        store.writeLicense(record);
        setLicence(record);
      },
    ).then((result) => {
      if (result === 'none') return;
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      if (result === 'invalid') showToast({ id: 'kiosk-licence', tone: 'error', title: t('invalid') });
    });
  }, [defaults, t]);

  useEffect(() => {
    if (!loaded.current) return;
    const q = kioskQuery(config, defaults);
    const kiosk = running ? '&kiosk=1' : '';
    window.history.replaceState(null, '', `${window.location.pathname}?${q}${kiosk}`);
  }, [config, defaults, running]);

  useEffect(() => {
    const id = window.setInterval(() => setShift((n) => n + 1), DRIFT_MS);
    return () => window.clearInterval(id);
  }, []);

  const set = (patch: Partial<IKioskConfig>) => setConfig((c) => ({ ...c, ...patch }));
  const shown = { ...config, logo: licenceAllows(licence, 'ambient.logo') ? config.logo : null };

  const start = () => {
    setRunning(true);
    if (screenfull.isEnabled) void screenfull.request().catch(() => undefined);
  };
  const leave = useCallback(() => {
    setRunning(false);
    wake.stop();
    if (screenfull.isEnabled && screenfull.isFullscreen) void screenfull.exit();
  }, []);

  const w = kioskWindow(config.schedule, now);
  const asleep =
    running && !w.inside && w.next !== null ? t('asleep', { time: formatUntil(w.next, now, { locale, fmt }) }) : null;
  const view = running ? surfaceView(snap, { locale, fmt }) : previewView(config.schedule, now);
  const s = config.schedule;
  const days = s ? t(s.days) : '';

  return (
    <section aria-labelledby="kiosk-h" className="flex flex-col gap-3 px-5 py-10 min-[700px]:px-10 lg:px-16 xl:px-24">
      <h1 id="kiosk-h" className="m-0 text-[22px] font-bold">
        {t('section')}
      </h1>
      <div className="grid items-start gap-8 xl:grid-cols-[960px_1fr]">
        <KioskScreen config={shown} view={view} shift={shift} onLeave={() => undefined} />
        <div className="flex flex-col gap-[14px]">
          <div className="flex flex-col gap-2">
            <span className={LABEL} id="kiosk-face">
              {t('face')}
            </span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="kiosk-face">
              {KIOSK_FACES.map((f) => (
                <Chip key={f} className={CHIP} pressed={config.face === f} onClick={() => set({ face: f })}>
                  {faceName(f)}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className={LABEL} id="kiosk-screen">
              {t('screen')}
            </span>
            <div className="flex gap-1.5" role="group" aria-labelledby="kiosk-screen">
              {KIOSK_SCREENS.map((sc) => (
                <Chip key={sc} className={CHIP} pressed={config.screen === sc} onClick={() => set({ screen: sc })}>
                  {sc === 'dark' ? t('midnight') : t('oled')}
                </Chip>
              ))}
            </div>
          </div>
          <div className={CARD}>
            <strong>{t('schedule')}</strong>
            <span className="text-muted-foreground-strong">
              {s
                ? t('scheduleBody', {
                    days,
                    from: formatTime(wallToday(s.from, now), locale, fmt),
                    to: formatTime(wallToday(s.to, now), locale, fmt),
                  })
                : t('alwaysBody')}
            </span>
          </div>
          <div className={CARD}>
            <strong>{t('burn')}</strong>
            <span className="text-muted-foreground-strong">{t('burnBody')}</span>
            <Button
              type="button"
              variant="outline"
              className="h-11 self-start rounded-[12px] px-4 text-[14px] font-semibold"
              onClick={() => setShift((n) => n + 1)}
            >
              {t('shift')}
            </Button>
          </div>
          <Button
            type="button"
            className="h-11 self-start rounded-[12px] border-0 px-4 text-[14px] font-bold"
            onClick={start}
          >
            {t('start')}
          </Button>
        </div>
      </div>
      {running
        ? createPortal(
            <div className="fixed inset-0 z-[100] bg-black">
              <KioskScreen config={shown} view={view} shift={shift} asleep={asleep} onLeave={leave} fill />
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
