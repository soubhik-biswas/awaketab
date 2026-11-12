'use client';

import { useState } from 'react';
import { Check, CircleCheck, Trash2, TriangleAlert } from 'lucide-react';
import { RadioGroup } from 'radix-ui';
import { Face } from '@/components/face';
import { cn } from '@/lib/utils';
import { clockTime } from '@/lib/tool/clock';
import { clearHistory } from '@/lib/tool/history';
import { shareLink } from '@/lib/tool/share';
import type { TToolLang } from '@/lib/tool/strings';
import { useGlance, useTickValue } from '../context';
import { CARD, Group, Note, RowText, SecLabel, StepNo, SwitchRow } from '../kit';
import { showNote } from '../overlays';
import { LANG_NAMES } from './settings';
import { PanelBody, PanelFoot } from './shell';

const HELP_STEPS: Record<string, number> = { battery: 3, unknown: 3, insecure: 2, policy: 2 };

// The real reason, the time it was checked and numbered steps; the video fallback is the pinned way out. A warning
// shows only while the browser is really refusing the lock: with the lock held, or nothing asked yet, the panel says
// so instead, and a hidden tab or a browser without wake locks gets its own plain line and one button.
export function HelpPanel() {
  const g = useGlance();
  const { t, reason, st } = g;
  const minute = useTickValue((tick) => Math.floor(tick.now / 60_000));
  const checked = g.checkedAt ?? minute * 60_000;
  const steps = HELP_STEPS[reason] ?? 3;
  if (st !== 'blocked') {
    const awake = st === 'running' || st === 'fallback';
    const calm = st !== 'needsyou' && st !== 'unsupported';
    const Icon = calm ? CircleCheck : TriangleAlert;
    const title = calm ? t('help.ok.h') : t(`banner.${st}.t`);
    const desc = !calm
      ? t(`banner.${st}.d`)
      : st === 'fallback'
        ? `${t('banner.fallback.t')} ${t('banner.fallback.d')}`
        : awake
          ? t('help.ok.awake')
          : t('help.ok.rest');
    return (
      <>
        <PanelBody>
          <div className={cn(CARD, 'flex gap-3.5 p-4')}>
            <span
              className={cn(
                'flex size-11 flex-none items-center justify-center rounded-[14px]',
                awake ? 'bg-(--tg-volt-soft) text-(--tg-volt)' : 'bg-(--tg-s2) text-(--tg-text)',
              )}
            >
              <Icon className="size-6" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="flex flex-col gap-1">
              <strong className="font-display text-[20px] font-bold tracking-[-0.02em]">{title}</strong>
              <span className="text-[13px] leading-[1.45] text-(--tg-t2)">{desc}</span>
            </span>
          </div>
        </PanelBody>
        {st === 'needsyou' ? (
          <PanelFoot
            primary={{
              label: t('dock.resume'),
              go: () => {
                g.a.resume();
                g.a.close();
              },
            }}
          />
        ) : null}
        {st === 'unsupported' ? <PanelFoot primary={{ label: t('help.video'), go: () => g.a.useFallback() }} /> : null}
      </>
    );
  }
  return (
    <>
      <PanelBody>
        <div className="flex gap-3.5 rounded-[18px] border border-[color-mix(in_srgb,var(--tg-red)_27%,transparent)] bg-(--tg-red-soft) p-4">
          <span className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-(--tg-red-soft) text-(--tg-red)">
            <TriangleAlert className="size-6" strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="flex flex-col gap-1">
            <strong className="font-display text-[20px] font-bold tracking-[-0.02em]">{t(`help.${reason}.h`)}</strong>
            <span className="text-[13px] leading-[1.45] text-(--tg-t2)">
              {t(`help.${reason}.d`)} {t('help.checked', { time: g.time(checked) })}
            </span>
          </span>
        </div>
        {Array.from({ length: steps }, (_, i) => (
          <div key={i} className="flex gap-3.5 border-b border-(--tg-border) px-1 py-3.5">
            <StepNo>{i + 1}</StepNo>
            <RowText title={t(`help.${reason}.s${i + 1}`)} desc={t(`help.${reason}.s${i + 1}d`)} />
          </div>
        ))}
      </PanelBody>
      <PanelFoot
        primary={{ label: t('help.video'), go: () => g.a.useFallback() }}
        secondary={{ label: t('help.again'), go: () => g.a.checkAgain() }}
      />
    </>
  );
}

export function ClearPanel() {
  const g = useGlance();
  const { t } = g;
  const [text, setText] = useState('');
  const n = g.history.length;
  const ok = text.trim().toUpperCase() === 'CLEAR';
  return (
    <>
      <PanelBody>
        <div className="flex gap-3.5 rounded-[18px] border border-[color-mix(in_srgb,var(--tg-red)_27%,transparent)] bg-(--tg-red-soft) p-4">
          <span className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-(--tg-red-soft) text-(--tg-red)">
            <Trash2 className="size-[22px]" strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="flex flex-col gap-1">
            <strong className="font-display text-[20px] font-bold tracking-[-0.02em]">{t('clear.h', { n })}</strong>
            <span className="text-[13px] leading-[1.45] text-(--tg-t2)">{t('clear.d')}</span>
          </span>
        </div>
        <label htmlFor="tg-clear" className="mt-2.5 font-mono text-[12px] tracking-[.14em] text-(--tg-t2) uppercase">
          {t('clear.type')}
        </label>
        <input
          id="tg-clear"
          value={text}
          onChange={(e) => setText(e.target.value.toUpperCase().slice(0, 5))}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-describedby="tg-clear-note"
          className="h-[52px] rounded-[16px] border-[1.5px] border-(--tg-red) bg-(--tg-field) px-4 font-mono text-[18px] tracking-[.2em] text-(--tg-text) shadow-[0_0_0_4px_var(--tg-red-soft)] outline-none"
        />
        <span id="tg-clear-note" className="mt-2 text-[13px] text-(--tg-t2)">
          {t('clear.note')}
        </span>
      </PanelBody>
      <PanelFoot
        primary={{
          label: t('clear.go', { n }),
          danger: true,
          disabled: !ok,
          go: () => {
            if (!ok) return;
            clearHistory();
            g.a.close();
            showNote(t('clear.done'));
          },
        }}
        secondary={{ label: t('clear.keep'), go: () => g.a.close() }}
      />
    </>
  );
}

// The six languages the board lists; a French or Portuguese tool adds its own row so the choice is always shown.
const LANG_ROWS: readonly TToolLang[] = ['en', 'de', 'ja', 'zh', 'hi', 'es'];

export function LanguagePanel() {
  const g = useGlance();
  const { t } = g;
  const now = useTickValue((tick) => Math.floor(tick.now / 60_000)) * 60_000;
  return (
    <PanelBody>
      <RadioGroup.Root value={g.lang} onValueChange={(v) => g.a.setLang(v)} aria-label={t('panel.language.t')}>
        <Group>
          {(LANG_ROWS.includes(g.lang) ? LANG_ROWS : [...LANG_ROWS, g.lang]).map((k) => {
            const on = k === g.lang;
            const time = clockTime(now, k, 12);
            return (
              <RadioGroup.Item
                key={k}
                value={k}
                lang={k}
                className="tg-btn tg-row flex min-h-[60px] w-full items-center gap-3.5 border-0 bg-transparent px-4 py-2.5 text-(--tg-text) [&+&]:border-t [&+&]:border-(--tg-border)"
              >
                <RowText title={LANG_NAMES[k]} desc={`${t(`lang.${k}`)} · ${time}`} />
                {on ? (
                  <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-(--tg-volt) text-(--tg-on-volt)">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                  </span>
                ) : null}
              </RadioGroup.Item>
            );
          })}
        </Group>
      </RadioGroup.Root>
      <Note>{t('lang.note')}</Note>
    </PanelBody>
  );
}

export function SharePanel() {
  const g = useGlance();
  const { t, settings } = g;
  const [look, setLook] = useState(true);
  const [length, setLength] = useState(true);
  const [start, setStart] = useState(false);
  const [copied, setCopied] = useState(false);
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const url = shareLink(origin, {
    face: g.face,
    vibe: settings.vibe,
    totalSec: settings.totalSec,
    look,
    length,
    start,
  });
  const shown = url.replace(/^https?:\/\//u, '');
  const copy = () => {
    const nav: Partial<Pick<Navigator, 'clipboard'>> = navigator;
    void nav.clipboard
      ?.writeText(url)
      .then(() => setCopied(true))
      .catch(() => undefined);
  };
  const share = () => {
    const nav: Partial<Pick<Navigator, 'share'>> = navigator;
    if (nav.share) void nav.share({ title: 'AwakeTab', url }).catch(() => undefined);
    else copy();
  };
  const len = settings.totalSec ? g.dur(settings.totalSec) : t('set.noEndCap');
  return (
    <>
      <PanelBody>
        <div className="flex items-center gap-3.5 rounded-[20px] border border-(--tg-border) bg-(--tg-s1) p-3">
          <span className="flex h-14 w-16 flex-none items-center justify-center overflow-hidden rounded-[14px] bg-(--tg-well)">
            <Face
              face={g.face}
              theme={g.faceTheme}
              state="running"
              remain={2292}
              total={3600}
              nowSec={39828}
              size={64}
              bare
              motion="off"
            />
          </span>
          <RowText title={`${len} · ${g.faceName(g.face)} · ${t(`vibe.${settings.vibe}.n`)}`} desc={t('share.card')} />
        </div>
        <SecLabel>{t('share.link')}</SecLabel>
        <div className="flex h-[52px] items-center gap-2.5 rounded-[16px] border border-(--tg-border-hi) bg-(--tg-field) pr-1.5 pl-4">
          <span className="min-w-0 flex-1 overflow-hidden font-mono text-[14px] text-ellipsis whitespace-nowrap text-(--tg-text)">
            {shown}
          </span>
          <button
            type="button"
            onClick={copy}
            className="tg-btn inline-flex h-11 flex-none items-center rounded-[12px] border-0 bg-(--tg-s2) px-3.5 text-[14px] font-bold text-(--tg-text)"
          >
            <span aria-live="polite">{copied ? t('share.copied') : t('share.copy')}</span>
          </button>
        </div>
        <SecLabel>{t('share.include')}</SecLabel>
        <Group>
          <SwitchRow title={t('share.look')} desc={t('share.lookD')} checked={look} onChange={setLook} />
          <SwitchRow title={t('share.length')} desc={t('share.lengthD')} checked={length} onChange={setLength} />
          <SwitchRow
            title={t('share.start')}
            desc={start ? t('share.startOn') : t('share.startOff')}
            checked={start}
            onChange={setStart}
          />
        </Group>
        <Note>{t('share.note')}</Note>
      </PanelBody>
      <PanelFoot
        primary={{ label: copied ? t('share.copied') : t('share.copyLink'), go: copy }}
        secondary={{ label: t('share.via'), go: share }}
      />
    </>
  );
}
