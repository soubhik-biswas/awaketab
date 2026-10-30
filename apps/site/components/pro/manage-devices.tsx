'use client';

import { Laptop, Monitor, Smartphone, Tablet, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DeviceAvatarStack,
  DevicePresenceSkeleton,
  DeviceStatusBadge,
  IDENTITY_CLASSES,
  identityFor,
  type IDevice,
} from '@/components/product/device-presence';
import { EmptyState } from '@/components/product/empty-state';
import { StatusAlert } from '@/components/product/status-alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { deviceKind, type TDeviceKind } from '@/lib/pro/device';
import {
  deactivateDevice,
  fetchActivations,
  forgetLicense,
  lapseState,
  readLicense,
  sha256Hex,
  type IActivation,
} from '@/lib/pro/license';
import { longDate, MAX_DEVICES, portalUrl } from '@/lib/pro/plans';
import { cn } from '@/lib/utils';
import { FlowColumn, H1, LEAD, LINK, RISE } from './flow';

type TState = 'loading' | 'list' | 'empty' | 'offline';

const KIND_ICON: Record<TDeviceKind, LucideIcon> = {
  laptop: Laptop,
  desktop: Monitor,
  tablet: Tablet,
  phone: Smartphone,
};

// /pro/manage: the devices that hold this licence, each in its identity colour, with removal behind a confirm.
export function ManageDevices({ activateHref, plansHref }: { activateHref: string; plansHref: string }) {
  const t = useTranslations('proflow.manage');
  const [state, setState] = useState<TState>('loading');
  const [rows, setRows] = useState<IActivation[]>([]);
  const [here, setHere] = useState('');
  const [lapse, setLapse] = useState<{ kind: 'grace' | 'lapsed'; date: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setState('loading');
    const record = readLicense();
    if (!record) {
      setState('empty');
      return;
    }
    setHere(await sha256Hex(record.deviceId).catch(() => ''));
    const data = await fetchActivations();
    if (data === 'none' || (data !== 'offline' && data.revoked)) {
      setState('empty');
      return;
    }
    // An error answer has no device list: that is "try again", never "no devices".
    if (data === 'offline' || !Array.isArray(data.activations)) {
      setState('offline');
      return;
    }
    const exp = typeof data.exp === 'number' ? data.exp : record.exp;
    const kind = lapseState(data.plan ?? record.plan, exp);
    setLapse(kind ? { kind, date: longDate(exp * 1000) } : null);
    setRows(data.activations);
    setState(data.activations.length > 0 ? 'list' : 'empty');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (row: IActivation, index: number) => {
    setBusy(row.devHash);
    const next = await deactivateDevice(row.devHash);
    setBusy(null);
    setConfirming(null);
    if (!next) return;
    if (row.devHash === here) {
      // This browser is no longer an activation, so its stored licence is dead.
      forgetLicense();
      setRows([]);
      setState('empty');
      return;
    }
    setRows(next);
    if (next.length === 0) setState('empty');
    requestAnimationFrame(() => {
      const buttons = list.current?.querySelectorAll<HTMLElement>('[data-remove]');
      buttons?.[Math.min(index, (buttons?.length ?? 1) - 1)]?.focus();
    });
  };

  const devices: IDevice[] = rows.map((row, i) => ({
    id: row.devHash,
    name: row.label,
    meta: t('added', { date: longDate(row.at) }),
    kind: deviceKind(row.label),
    identity: identityFor(i),
    status: 'idle',
  }));
  const free = Math.max(0, MAX_DEVICES - rows.length);

  return (
    <FlowColumn className={cn(RISE, 'max-w-[680px] items-stretch text-left')}>
      <h1 className={cn(H1, 'text-center')}>{t('h1')}</h1>
      <p className={cn(LEAD, 'text-center')}>{t('lead')}</p>

      {lapse ? (
        <StatusAlert
          variant={lapse.kind === 'grace' ? 'paused' : 'refused'}
          title={t(`lapse.${lapse.kind}`, { date: lapse.date })}
        >
          <a className="text-link underline underline-offset-[3px]" href={portalUrl()}>
            {t('lapse.portal')}
          </a>
        </StatusAlert>
      ) : null}

      {state === 'loading' ? (
        <div className="flex flex-col gap-3" aria-live="polite">
          <span className="text-[14px] font-semibold">{t('loading')}</span>
          <DevicePresenceSkeleton label={t('loading')} />
          <DevicePresenceSkeleton label={t('loading')} />
        </div>
      ) : null}

      {state === 'offline' ? (
        <StatusAlert
          variant="refused"
          title={t('offline.title')}
          action={{ label: t('offline.retry'), onClick: () => void load() }}
        >
          {t('offline.text')}
        </StatusAlert>
      ) : null}

      {state === 'empty' ? (
        <EmptyState
          scene="noitems"
          title={t('empty')}
          action={
            <div className="flex flex-wrap justify-center gap-2.5">
              <Button asChild size="lg" className="h-13 rounded-md px-[22px] text-[16px] font-bold">
                <a href={activateHref}>{t('activate')}</a>
              </Button>
              <a className={cn(LINK, 'inline-flex items-center')} href={plansHref}>
                {t('plans')}
              </a>
            </div>
          }
        />
      ) : null}

      {state === 'list' ? (
        <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <DeviceAvatarStack devices={devices} />
            <span className="flex flex-1 flex-col gap-1.5">
              <span className="flex justify-between gap-2 text-[14px] font-semibold">
                <span>{t('meter', { n: rows.length })}</span>
                <span className="text-muted-foreground-strong">
                  {free === 0 ? t('left.none') : free === 1 ? t('left.one') : t('left._', { n: free })}
                </span>
              </span>
              <Progress value={(rows.length / MAX_DEVICES) * 100} aria-label={t('meter', { n: rows.length })} />
            </span>
          </div>
          <div ref={list} className="flex flex-col" role="list">
            {devices.map((device, i) => {
              const row = rows[i];
              if (!row) return null;
              const Icon = KIND_ICON[device.kind];
              const isHere = row.devHash === here;
              const labelId = `device-${String(i)}`;
              return (
                <div key={device.id} role="listitem" className="flex flex-col gap-2 border-t py-2.5">
                  <div className="flex min-h-[52px] items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'inline-flex size-8 shrink-0 items-center justify-center rounded-sm',
                        IDENTITY_CLASSES[device.identity],
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span id={labelId} className="text-[14px] font-semibold text-foreground">
                        {device.name}
                      </span>
                      <span className="text-[12px] leading-[1.45] text-muted-foreground-strong">{device.meta}</span>
                    </span>
                    {isHere ? <DeviceStatusBadge status="idle" label={t('here')} /> : null}
                    {lapse?.kind === 'lapsed' ? <DeviceStatusBadge status="idle" label={t('off')} /> : null}
                    <Button
                      type="button"
                      variant="outline"
                      data-remove=""
                      aria-describedby={labelId}
                      disabled={busy !== null}
                      onClick={() => setConfirming(row.devHash)}
                    >
                      {t('remove')}
                    </Button>
                  </div>
                  {confirming === row.devHash ? (
                    <div
                      role="group"
                      aria-label={t('confirm.aria', { label: row.label })}
                      className="flex flex-col gap-2.5 rounded-[14px] border border-destructive/30 bg-destructive-soft p-3"
                    >
                      <span className="text-[14px]">
                        {isHere ? t('confirm.here') : t('confirm.other', { label: row.label })}
                      </span>
                      <span className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" autoFocus onClick={() => setConfirming(null)}>
                          {t('keep')}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          loading={busy === row.devHash}
                          onClick={() => void remove(row, i)}
                        >
                          {t('removeDevice')}
                        </Button>
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </FlowColumn>
  );
}
