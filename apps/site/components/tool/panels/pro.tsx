'use client';

import { useState } from 'react';
import { Check, Laptop, Monitor, Smartphone, Sparkle, Tablet, Tv, type LucideIcon } from 'lucide-react';
import { RadioGroup } from 'radix-ui';
import { Scene } from '@/components/scene/scene';
import { cn } from '@/lib/utils';
import { portalUrl, priceLabel, yearlySaving } from '@/lib/pro/plans';
import { isLatin } from '@/lib/tool/strings';
import { pro, type IProDevice } from '@/lib/tool/pro';
import { isAwake } from '@/lib/wake';
import { useGlance, useTickValue } from '../context';
import { Group, Note, RowText, SecLabel, StepNo, Tag } from '../kit';
import { PanelBody, PanelFoot } from './shell';

type TPlan = 'yearly' | 'monthly';

function Accent({ children }: { children: string }) {
  const g = useGlance();
  return (
    <span
      className={cn(
        'inline-block bg-clip-text whitespace-nowrap text-transparent',
        isLatin(g.lang) && 'pr-[.06em] font-accent text-[1.08em] font-normal tracking-[-0.01em] italic',
      )}
      style={{
        backgroundImage: 'linear-gradient(100deg, var(--tg-volt) 0%, var(--tg-mint) 45%, var(--tg-violet) 100%)',
      }}
    >
      {children}
    </span>
  );
}

function Kicker() {
  const g = useGlance();
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[12px] tracking-[.14em] text-(--tg-violet)">
      <Sparkle className="size-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
      {g.t('pro.kicker')}
    </span>
  );
}

const go = (url: string) => () => window.location.assign(url);

// Pro is optional and only syncs many screens. The prices stay placeholders here; checkout happens on the Pro page.
export function ProPanel() {
  const g = useGlance();
  const { t } = g;
  const [plan, setPlan] = useState<TPlan>('yearly');
  const heroH = g.phone ? 26 : 30;
  return (
    <>
      <PanelBody>
        <div
          className="flex flex-col gap-2 rounded-[22px] border border-(--tg-border) p-[18px]"
          style={{ background: 'var(--tg-pro-hero)' }}
        >
          <Kicker />
          <strong className="font-display leading-[1.05] font-bold tracking-[-0.03em]" style={{ fontSize: heroH }}>
            {t('pro.h1a')} <Accent>{t('pro.h1b')}</Accent>
          </strong>
          <span className="text-[13px] leading-[1.45] text-(--tg-t2)">{t('pro.d')}</span>
        </div>
        <RadioGroup.Root
          value={plan}
          onValueChange={(v) => setPlan(v as TPlan)}
          aria-label={t('pro.plan')}
          className="grid grid-cols-2 gap-2.5"
        >
          {(['yearly', 'monthly'] as const).map((p) => {
            const on = plan === p;
            return (
              <RadioGroup.Item
                key={p}
                value={p}
                className={cn(
                  'tg-btn flex flex-col gap-1.5 rounded-[18px] bg-(--tg-s1) p-4 text-left text-(--tg-text)',
                  on
                    ? 'border-2 border-(--tg-violet) shadow-[0_0_0_4px_var(--tg-violet-soft2)]'
                    : 'border border-(--tg-border)',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <strong className="text-[15px] font-semibold">{t(`pro.${p}`)}</strong>
                  {p === 'yearly' ? <Tag>{t('pro.save', { n: yearlySaving() })}</Tag> : null}
                </span>
                <span className="font-display text-[22px] font-bold tracking-[-0.02em]">
                  {t(`pro.${p}Price`, { price: priceLabel(p) })}
                </span>
                <span className="text-[13px] leading-[1.45] text-(--tg-t2)">{t(`pro.${p}D`)}</span>
              </RadioGroup.Item>
            );
          })}
        </RadioGroup.Root>
        <Group>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex min-h-[52px] items-center gap-3 px-4 py-2 [&+&]:border-t [&+&]:border-(--tg-border)"
            >
              <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-(--tg-violet-soft) text-(--tg-violet)">
                <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold">{t(`pro.f${i}`)}</span>
            </div>
          ))}
        </Group>
        <Note>{t('pro.note', { price: priceLabel('yearly') })}</Note>
      </PanelBody>
      <PanelFoot
        primary={{ label: t('pro.trial'), go: go(`/pro/checkout?plan=${plan}#account`) }}
        secondary={{ label: t('pro.later'), go: () => g.a.close() }}
      />
    </>
  );
}

export function ProDonePanel() {
  const g = useGlance();
  const { t } = g;
  return (
    <>
      <PanelBody>
        <div className="flex flex-col items-center gap-2.5 py-2 text-center">
          <Scene scene="success" theme={g.night ? 'dark' : 'light'} width={240} decorative />
          <strong
            className="font-display leading-[1.05] font-bold tracking-[-0.03em]"
            style={{ fontSize: g.phone ? 26 : 30 }}
          >
            {t('proDone.h1a')} <Accent>{t('proDone.h1b')}</Accent>
          </strong>
          <span className="text-[13px] leading-[1.45] text-(--tg-t2)">{t('proDone.d')}</span>
        </div>
        <Group>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3.5 px-4 py-3.5 [&+&]:border-t [&+&]:border-(--tg-border)">
              <StepNo>{i}</StepNo>
              <RowText title={t(`proDone.s${i}`)} desc={t(`proDone.s${i}d`)} />
            </div>
          ))}
        </Group>
      </PanelBody>
      <PanelFoot
        primary={{ label: t('proDone.back'), go: () => g.a.close() }}
        secondary={{ label: t('proDone.manage'), go: () => g.a.open('plan') }}
      />
    </>
  );
}

function PlanRow({
  title,
  desc,
  value,
  danger = false,
  onClick,
}: {
  title: string;
  desc: string;
  value?: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="flex min-h-[60px] items-center gap-3.5 px-4 py-2.5 [&+&]:border-t [&+&]:border-(--tg-border)">
      <RowText title={<span className={danger ? 'text-(--tg-red)' : undefined}>{title}</span>} desc={desc} />
      {value ? (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'tg-btn h-11 rounded-[12px] border-0 bg-transparent px-2 text-[14px] font-semibold whitespace-nowrap',
            danger ? 'text-(--tg-red)' : 'text-(--tg-violet)',
          )}
        >
          {value}
        </button>
      ) : null}
    </div>
  );
}

export function PlanPanel() {
  const g = useGlance();
  const { t } = g;
  const acct = g.pro.account;
  const via = t(`settings.via.${acct?.method ?? 'google'}`);
  const date = g.pro.account?.renewsOn || '—';
  const plan = acct?.plan ?? 'yearly';
  const price = plan === 'monthly' ? priceLabel('monthly') : priceLabel('yearly');
  const portal = () => window.location.assign(pro.billingUrl());
  return (
    <>
      <PanelBody>
        <div className="flex items-center gap-3.5 rounded-[18px] border border-(--tg-border) bg-(--tg-s1) px-4 py-3.5">
          <span className="flex size-11 flex-none items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--tg-volt),var(--tg-violet))] text-[18px] font-bold text-(--tg-on-violet)">
            {(acct?.name || via).charAt(0).toUpperCase()}
          </span>
          <RowText title={t('settings.signedIn', { via })} desc={t(`plan.renews.${plan}`, { date })} />
          <Tag>{t('plan.active')}</Tag>
        </div>
        <SecLabel>{t('plan.plan')}</SecLabel>
        <Group>
          <PlanRow
            title={t(`plan.${plan}`)}
            desc={t(`plan.${plan}D`, { date, price })}
            value={t('plan.change')}
            onClick={portal}
          />
          <PlanRow title={t('plan.payment')} desc={t('plan.paymentD')} value={t('plan.update')} onClick={portal} />
          <PlanRow
            title={t('plan.screens')}
            desc={t('plan.screensD', { n: g.pro.devices.length, max: g.pro.maxDevices })}
            value={t('plan.manage')}
            onClick={() => g.a.open('devices')}
          />
          <PlanRow
            title={t('plan.cancel')}
            desc={t('plan.cancelD', { date })}
            value={t('plan.cancelBtn')}
            danger
            onClick={portal}
          />
        </Group>
        <SecLabel>{t('plan.receipts')}</SecLabel>
        {g.ui.qa.samples ? (
          <Group>
            <PlanRow title={date} desc={t('plan.r1')} value={t('plan.download')} onClick={portal} />
            <PlanRow title={date} desc={t('plan.r2')} value={t('plan.download')} onClick={portal} />
          </Group>
        ) : (
          // Receipts live with the payment provider, so the list is its portal rather than a copy kept here.
          <Group>
            <PlanRow
              title={t('plan.allReceipts')}
              desc={t('plan.allReceiptsD')}
              value={t('plan.open')}
              onClick={() => window.location.assign(portalUrl())}
            />
          </Group>
        )}
        <Note>{t('plan.note')}</Note>
      </PanelBody>
      <PanelFoot
        primary={{ label: t('plan.done'), go: () => g.a.close() }}
        secondary={{ label: t('plan.receipt'), go: portal }}
      />
    </>
  );
}

const KIND_ICON: Record<IProDevice['kind'], LucideIcon> = {
  laptop: Laptop,
  desktop: Monitor,
  tablet: Tablet,
  phone: Smartphone,
};

interface IScreenRow {
  name: string;
  icon: LucideIcon;
  status: string;
  awake: boolean;
  btn: 'stop' | 'start' | null;
}

const SAMPLE: IScreenRow[] = [
  { name: 'This laptop', icon: Laptop, status: 'Awake · until 12:01 PM', awake: true, btn: 'stop' },
  { name: 'Kitchen iPad', icon: Tablet, status: 'Awake · 22 min left', awake: true, btn: 'stop' },
  { name: 'Living-room TV', icon: Tv, status: 'Asleep · last used yesterday', awake: false, btn: 'start' },
];

// Your screens: this device is live and can start or stop here; the others show when they were added, because
// there is no presence service to reach them yet.
export function DevicesPanel() {
  const g = useGlance();
  const { t } = g;
  const here = isAwake(g.st);
  const until = useTickValue((tick) => g.time(tick.endsAt));
  const rows: IScreenRow[] = g.ui.qa.samples
    ? SAMPLE
    : g.pro.devices.map((d) => ({
        name: d.name,
        icon: KIND_ICON[d.kind],
        status: d.current ? (here ? t('pill.awake', { time: until }) : t('devices.asleep')) : d.detail,
        awake: d.current && here,
        btn: d.current ? (here ? 'stop' : 'start') : null,
      }));
  const awake = rows.filter((r) => r.awake).length;
  return (
    <>
      <PanelBody>
        <div
          className="flex flex-col gap-2 rounded-[22px] border border-(--tg-border) p-[18px]"
          style={{ background: 'var(--tg-week)' }}
        >
          <span className="font-mono text-[12px] tracking-[.14em] text-(--tg-t2)">
            {t('devices.kicker', { n: rows.length, max: g.pro.maxDevices })}
          </span>
          <strong className="font-display text-[26px] font-bold tracking-[-0.03em]">
            {rows.length ? t('devices.awake', { n: awake }) : t('devices.none')}
          </strong>
          <span className="text-[13px] leading-[1.45] text-(--tg-t2)">
            {rows.length ? t('devices.d') : t('devices.noneD')}
          </span>
        </div>
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.name}
              className="flex items-center gap-3.5 rounded-[18px] border border-(--tg-border) bg-(--tg-s1) px-3.5 py-3"
            >
              <span className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-(--tg-s2) text-(--tg-text)">
                <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <strong className="text-[15px] font-semibold">{r.name}</strong>
                <span
                  className={cn(
                    'inline-flex items-center gap-2 text-[13px]',
                    r.awake ? 'text-(--tg-volt)' : 'text-(--tg-t2)',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn('size-2 rounded-full', r.awake ? 'bg-(--tg-volt)' : 'border-2 border-(--tg-t3)')}
                  />
                  {r.status}
                </span>
              </span>
              {r.btn ? (
                <button
                  type="button"
                  onClick={() => (r.btn === 'stop' ? g.a.stop() : g.a.start())}
                  className={cn(
                    'tg-btn inline-flex h-11 flex-none items-center rounded-[12px] px-3.5 text-[14px] font-bold',
                    r.btn === 'start'
                      ? 'border border-transparent bg-(--tg-violet) text-(--tg-on-violet)'
                      : 'border border-(--tg-border) bg-(--tg-s2) text-(--tg-text)',
                  )}
                >
                  {t(`devices.${r.btn}`)}
                </button>
              ) : null}
            </div>
          );
        })}
        <Note>{t('devices.note')}</Note>
      </PanelBody>
      <PanelFoot
        primary={{
          label: g.pro.isPro || g.ui.qa.samples ? t('devices.add') : t('settings.seePro'),
          go: g.pro.isPro || g.ui.qa.samples ? () => void pro.addDevice() : () => g.a.open('pro'),
        }}
        secondary={{ label: t('devices.done'), go: () => g.a.close() }}
      />
    </>
  );
}
