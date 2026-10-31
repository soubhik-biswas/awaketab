'use client';

import { Laptop, LoaderCircle, Monitor, Smartphone, Tablet, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusAlert } from '@/components/product/status-alert';
import { Button } from '@/components/ui/button';
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
import { H1, LEAD, LINK, Outcome, PRIMARY, Rise } from './flow';

type TState = 'loading' | 'list' | 'empty' | 'offline';

const KIND_ICON: Record<TDeviceKind, LucideIcon> = {
  laptop: Laptop,
  desktop: Monitor,
  tablet: Tablet,
  phone: Smartphone,
};

// /pro/manage: the screens that hold this licence, laid out like the Your screens panel, with removal behind an
// inline confirm.
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
    // An error answer has no device list: that is "try again", never "no screens".
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
      buttons?.[Math.min(index, buttons.length - 1)]?.focus();
    });
  };

  if (state === 'empty')
    return (
      <Outcome
        scene="noitems"
        title={t('empty')}
        lead={t('emptyD')}
        primary={{ label: t('activate'), href: activateHref }}
        secondary={{ label: t('plans'), href: plansHref }}
      />
    );

  return (
    <Rise className="items-stretch text-left">
      <h1 className={cn(H1, 'text-center')} tabIndex={-1}>
        {t('h1')}
      </h1>
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
        <p role="status" className="m-0 flex items-center justify-center gap-2 text-[15px] font-semibold">
          <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {t('loading')}
        </p>
      ) : null}

      {state === 'offline' ? (
        <StatusAlert
          role="alert"
          variant="refused"
          title={t('offline.title')}
          action={{ label: t('offline.retry'), onClick: () => void load() }}
        >
          {t('offline.text')}
        </StatusAlert>
      ) : null}

      {state === 'list' ? (
        <>
          <div className="flex flex-col gap-2 rounded-[22px] border border-border bg-card p-[18px] [background-image:radial-gradient(120%_120%_at_100%_0%,color-mix(in_srgb,var(--lamp)_8%,transparent),transparent_55%)]">
            <span className="font-mono text-[12px] tracking-[.14em] text-muted-foreground-strong uppercase">
              {t('kicker', { n: rows.length, max: MAX_DEVICES })}
            </span>
            <strong className="font-display text-[26px] font-bold tracking-[-0.03em]">
              {t('count', { n: rows.length })}
            </strong>
          </div>
          <div ref={list} className="flex flex-col gap-2.5" role="list">
            {rows.map((row, i) => {
              const Icon = KIND_ICON[deviceKind(row.label)];
              const isHere = row.devHash === here;
              const labelId = `device-${String(i)}`;
              return (
                <div
                  key={row.devHash}
                  role="listitem"
                  className="flex flex-col gap-2.5 rounded-[18px] border border-border bg-card px-3.5 py-3"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-secondary text-foreground">
                      <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                      <strong id={labelId} className="text-[15px] font-semibold">
                        {row.label}
                      </strong>
                      <span className="inline-flex items-center gap-2 text-[13px] text-muted-foreground-strong">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'size-2 rounded-full',
                            isHere ? 'bg-lamp' : 'border-2 border-muted-foreground',
                          )}
                        />
                        {isHere ? t('here') : t('added', { date: longDate(row.at) })}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      data-remove=""
                      aria-describedby={labelId}
                      disabled={busy !== null}
                      className="h-11 rounded-[12px] px-3.5 text-[14px] font-bold"
                      onClick={() => setConfirming(row.devHash)}
                    >
                      {t('remove')}
                    </Button>
                  </div>
                  {confirming === row.devHash ? (
                    <div
                      role="group"
                      aria-label={t('confirm.aria', { label: row.label })}
                      className="flex flex-col gap-2.5 rounded-[14px] border border-destructive/30 bg-destructive/6 p-3 dark:bg-destructive/10"
                    >
                      <span className="text-[14px]">
                        {isHere ? t('confirm.here') : t('confirm.other', { label: row.label })}
                      </span>
                      <span className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          autoFocus
                          className="h-11 rounded-[12px]"
                          onClick={() => setConfirming(null)}
                        >
                          {t('keep')}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          loading={busy === row.devHash}
                          className="h-11 rounded-[12px]"
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
          <span className="text-[13px] leading-[1.5] text-muted-foreground-strong">{t('note')}</span>
          <div className="flex flex-col items-center gap-2">
            <Button asChild className={PRIMARY}>
              <a href={portalUrl()}>{t('portal')}</a>
            </Button>
            <a className={LINK} href={plansHref}>
              {t('back')}
            </a>
          </div>
        </>
      ) : null}
    </Rise>
  );
}
