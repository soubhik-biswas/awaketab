'use client';

import Link from 'next/link';
import { Globe, Headphones, MessageCircle, Share, Sparkle, Trash2, User, type LucideIcon } from 'lucide-react';
import { RadioGroup, ToggleGroup } from 'radix-ui';
import { BorderBeam } from '@/components/ui-effects/border-beam';
import { cn } from '@/lib/utils';
import { priceLabel } from '@/lib/pro/plans';
import { ROUTES } from '@/lib/routes';
import type { TChimeKind, TThemeChoice } from '@/lib/tool/settings';
import type { TPanel } from '@/lib/tool/ui';
import { useGlance } from '../context';
import { AVATAR, CARD, Chevron, FreeBadge, GHOST_BTN, Group, ROW, RowText, SecLabel, SwitchRow } from '../kit';
import { PanelBody } from './shell';

const THEMES: Array<[TThemeChoice, string, string]> = [
  ['auto', '#0D1020', '#F4F4F9'],
  ['light', '#F4F4F9', '#FFFFFF'],
  ['dark', '#0D1020', '#1A1F35'],
  ['oled', '#000000', '#0D1020'],
];

const CHIMES: TChimeKind[] = ['two', 'bell', 'off'];

export const LANG_NAMES: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  ja: '日本語',
  zh: '中文',
  hi: 'हिन्दी',
  es: 'Español',
};

function MoreRow({
  icon: Icon,
  title,
  desc,
  value,
  danger = false,
  go,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  value?: string;
  danger?: boolean;
  go: () => void;
}) {
  return (
    <button type="button" onClick={go} className={cn('tg-btn', ROW, danger ? 'text-(--tg-red)' : 'text-(--tg-t2)')}>
      <span
        className={cn(
          'flex size-9 flex-none items-center justify-center rounded-[12px]',
          danger ? 'bg-(--tg-red-soft) text-(--tg-red)' : 'bg-(--tg-s2) text-(--tg-text)',
        )}
      >
        <Icon className="size-[18px]" strokeWidth={2} aria-hidden="true" />
      </span>
      <RowText title={<span className={danger ? 'text-(--tg-red)' : undefined}>{title}</span>} desc={desc} />
      {value ? <span className="text-[14px] whitespace-nowrap text-(--tg-t2)">{value}</span> : null}
      <Chevron />
    </button>
  );
}

// One account state at a time: signed out, or signed in (free or Pro). Billing never shows next to "Not signed in".
function AccountCard() {
  const g = useGlance();
  const { t } = g;
  const acct = g.pro.account;
  if (!acct) {
    return (
      <div className={cn(CARD, 'flex items-center gap-3.5 px-4 py-3.5')}>
        <span className={AVATAR}>
          <User className="size-[22px]" strokeWidth={2} aria-hidden="true" />
        </span>
        <RowText title={t('settings.signedOut')} desc={t('settings.signedOutD')} />
        <Link href={g.pro.expired ? ROUTES.expired : ROUTES.signin} className={GHOST_BTN}>
          {t('settings.signIn')}
        </Link>
      </div>
    );
  }
  const via = t(`settings.via.${acct.method}`);
  return (
    <div className={cn(CARD, 'flex items-center gap-3.5 px-4 py-3.5')}>
      <span className="flex size-11 flex-none items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--tg-volt),var(--tg-violet))] text-[18px] font-bold text-(--tg-on-violet)">
        {(acct.name || via).charAt(0).toUpperCase()}
      </span>
      <RowText
        title={t('settings.signedIn', { via })}
        desc={g.pro.isPro ? t('settings.proOn') : t('settings.freeOn')}
      />
      {g.pro.isPro ? (
        <button type="button" onClick={() => g.a.open('plan')} className={GHOST_BTN}>
          {t('settings.manage')}
        </button>
      ) : null}
    </div>
  );
}

export function SettingsPanel() {
  const g = useGlance();
  const { t, settings } = g;
  const go = (p: TPanel) => () => g.a.open(p);
  return (
    <PanelBody>
      <SecLabel>{t('settings.appearance')}</SecLabel>
      <RadioGroup.Root
        value={g.themeChoice}
        onValueChange={(v) => g.a.setTheme(v as TThemeChoice)}
        aria-label={t('settings.theme')}
        className="grid grid-cols-4 gap-2"
      >
        {THEMES.map(([k, a, b]) => {
          const on = g.themeChoice === k;
          return (
            <RadioGroup.Item
              key={k}
              value={k}
              className={cn(
                'tg-btn flex flex-col items-stretch gap-2 rounded-[16px] bg-(--tg-s1) px-2 pt-2 pb-2.5 text-(--tg-text)',
                on ? 'border-2 border-(--tg-volt)' : 'border border-(--tg-border)',
              )}
            >
              <span className="flex h-11 overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_var(--tg-border)]">
                <span className="flex-1" style={{ background: a }} />
                <span className="flex-1" style={{ background: b }} />
              </span>
              <span className={cn('text-center text-[14px]', on ? 'font-bold' : 'font-semibold')}>
                {t(`settings.themes.${k}`)}
              </span>
            </RadioGroup.Item>
          );
        })}
      </RadioGroup.Root>
      <SecLabel>{t('settings.clock')}</SecLabel>
      <Group>
        <SwitchRow
          title={t('settings.h12')}
          desc={t('settings.h12D')}
          checked={settings.h12}
          onChange={(h12) => g.a.update({ h12 })}
        />
        <SwitchRow
          title={t('settings.secs')}
          desc={t('settings.secsD')}
          checked={settings.secs}
          onChange={(secs) => g.a.update({ secs })}
        />
        <SwitchRow
          title={t('settings.dim')}
          desc={t('settings.dimD')}
          checked={settings.dim}
          onChange={(dim) => g.a.update({ dim })}
        />
      </Group>
      <SecLabel>{t('settings.sound')}</SecLabel>
      <Group>
        <div className={cn(ROW, 'flex-wrap')}>
          <RowText title={t('settings.chime')} desc={t('settings.chimeD')} />
          <ToggleGroup.Root
            type="single"
            value={settings.chime}
            onValueChange={(v) => v && g.a.update({ chime: v as TChimeKind })}
            aria-label={t('settings.chime')}
            className="flex gap-0.5 rounded-[13px] bg-(--tg-s2) p-[3px]"
          >
            {CHIMES.map((k) => (
              <ToggleGroup.Item
                key={k}
                value={k}
                className={cn(
                  'tg-btn h-11 rounded-[10px] border-0 px-3 text-[14px] whitespace-nowrap',
                  settings.chime === k
                    ? 'bg-(--tg-s3) font-bold text-(--tg-text)'
                    : 'bg-transparent font-semibold text-(--tg-t2)',
                )}
              >
                {t(`settings.chimes.${k}`)}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        </div>
        <button type="button" onClick={go('sound')} className={cn('tg-btn', ROW)}>
          <RowText title={t('settings.mixer')} desc={t('settings.mixerD')} />
          <FreeBadge>{t('free')}</FreeBadge>
        </button>
        <button type="button" onClick={go('studio')} className={cn('tg-btn', ROW)}>
          <RowText title={t('settings.studio')} desc={t('settings.studioD')} />
          <FreeBadge>{t('free')}</FreeBadge>
        </button>
      </Group>
      <SecLabel>{t('settings.more')}</SecLabel>
      <Group>
        <MoreRow
          icon={Headphones}
          title={t('settings.ambient')}
          desc={t('settings.ambientD')}
          value={t('free')}
          go={go('sound')}
        />
        <MoreRow
          icon={Globe}
          title={t('settings.language')}
          desc={t('settings.languageD')}
          value={LANG_NAMES[g.lang]}
          go={go('language')}
        />
        <MoreRow icon={Share} title={t('settings.share')} desc={t('settings.shareD')} go={go('share')} />
        <MoreRow icon={Trash2} title={t('settings.clear')} desc={t('settings.clearD')} danger go={go('clear')} />
      </Group>
      <SecLabel>{t('settings.account')}</SecLabel>
      <AccountCard />
      <button
        type="button"
        onClick={() => g.a.feedback()}
        className={cn('tg-btn', CARD, 'flex w-full items-center gap-3.5 px-4 py-3 text-(--tg-text)')}
      >
        <span className={AVATAR}>
          <MessageCircle className="size-5" strokeWidth={2} aria-hidden="true" />
        </span>
        <RowText title={t('settings.feedback')} desc={t('settings.feedbackD')} />
        <Chevron size={18} />
      </button>
      <div className="relative mt-1 overflow-hidden rounded-[22px] p-[1.5px]">
        <BorderBeam size={160} duration={6} borderWidth={1.5} colorFrom="var(--tg-violet)" colorTo="var(--tg-volt)" />
        <div
          className="relative flex flex-col gap-2 rounded-[21px] p-[18px]"
          style={{ background: 'var(--tg-pro-card)' }}
        >
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] tracking-[.14em] text-(--tg-violet)">
            <Sparkle className="size-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
            {t('pro.kicker')}
          </span>
          <strong className="font-display text-[22px] font-bold tracking-[-0.02em]">
            {g.pro.isPro ? t('settings.proCardOn') : t('settings.proCard')}
          </strong>
          <span className="text-[13px] leading-[1.45] text-(--tg-t2)">
            {g.pro.isPro ? t('settings.proCardOnD') : t('settings.proCardD', { price: priceLabel('yearly') })}
          </span>
          <button
            type="button"
            onClick={go(g.pro.isPro ? 'plan' : 'pro')}
            className="tg-btn mt-1 h-11 self-start rounded-[14px] border-0 bg-(--tg-violet) px-[18px] text-[15px] font-bold text-(--tg-on-violet)"
          >
            {g.pro.isPro ? t('settings.manage') : t('settings.seePro')}
          </button>
        </div>
      </div>
    </PanelBody>
  );
}
