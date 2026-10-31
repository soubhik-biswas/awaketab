'use client';

import { useState } from 'react';
import { Check, Trash2, TriangleAlert } from 'lucide-react';
import { RadioGroup } from 'radix-ui';
import { Face } from '@/components/face';
import { clockTime } from '@/lib/tool/clock';
import { faceLabel } from '@/lib/tool/collections';
import { clearHistory } from '@/lib/tool/history';
import { shareLink } from '@/lib/tool/share';
import type { TToolLang } from '@/lib/tool/strings';
import { useGlance } from '../context';
import { Group, Note, RowText, SecLabel, StepNo, SwitchRow } from '../kit';
import { showNote } from '../overlays';
import { LANG_NAMES } from './settings';
import { PanelBody, PanelFoot } from './shell';

const HELP_STEPS: Record<string, number> = { battery: 3, unknown: 3, insecure: 2, policy: 2 };

// The real reason, the time it was checked and numbered steps; the video fallback is the pinned way out.
export function HelpPanel() {
  const g = useGlance();
  const { t, reason } = g;
  const checked = g.snap.checkedAt ?? g.now;
  const steps = HELP_STEPS[reason] ?? 3;
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

const LANG_ROWS: Array<[string, TToolLang | 'es']> = [
  ['en', 'en'],
  ['de', 'de'],
  ['ja', 'ja'],
  ['zh', 'zh'],
  ['hi', 'hi'],
  ['es', 'es'],
];

export function LanguagePanel() {
  const g = useGlance();
  const { t } = g;
  return (
    <PanelBody>
      <RadioGroup.Root value={g.lang} onValueChange={(v) => g.a.setLang(v)} aria-label={t('panel.language.t')}>
        <Group>
          {LANG_ROWS.map(([k, fmtLang]) => {
            const on = k === g.lang;
            const time = fmtLang === 'es' ? clockTime(g.now, 'de', 12) : clockTime(g.now, fmtLang, 12);
            return (
              <RadioGroup.Item
                key={k}
                value={k}
                lang={k}
                className="tg-btn flex min-h-[60px] w-full items-center gap-3.5 border-0 bg-transparent px-4 py-2.5 text-(--tg-text) [&+&]:border-t [&+&]:border-(--tg-border)"
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
          <RowText title={`${len} · ${faceLabel(g.face)} · ${t(`vibe.${settings.vibe}.n`)}`} desc={t('share.card')} />
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
