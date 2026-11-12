'use client';

import { Check, Pause, Sparkles, Waves, type LucideIcon } from 'lucide-react';
import { RadioGroup, Slider, ToggleGroup } from 'radix-ui';
import { Face } from '@/components/face';
import { cn } from '@/lib/utils';
import { pro } from '@/lib/tool/pro';
import { VIBES, type TVibe, type TVibeMotion } from '@/lib/tool/settings';
import { useGlance } from '../context';
import { Note, SecLabel } from '../kit';
import { VibeScene } from '../vibe-scene';
import { PanelBody, PanelFoot } from './shell';

const MOTIONS: [TVibeMotion, LucideIcon][] = [
  ['still', Pause],
  ['calm', Waves],
  ['lively', Sparkles],
];

const SEG_ITEM = 'tg-btn h-11 flex-1 rounded-[12px] border-0 text-[14px]';

export function VibesPanel() {
  const g = useGlance();
  const { t, settings, night, phone } = g;
  return (
    <PanelBody>
      <RadioGroup.Root
        value={settings.vibe}
        onValueChange={(v) => g.a.setVibe(v as TVibe)}
        aria-label={t('vibes.label')}
        className="grid grid-cols-2 gap-2.5"
      >
        {VIBES.map((k) => {
          const on = settings.vibe === k;
          return (
            <RadioGroup.Item
              key={k}
              value={k}
              className={cn(
                'tg-btn tg-tile flex flex-col gap-2.5 rounded-[20px] bg-(--tg-s1) px-2 pt-2 pb-3 text-(--tg-text)',
                on
                  ? 'border-2 border-(--tg-volt) shadow-[0_0_0_4px_var(--tg-volt-soft)]'
                  : 'border border-(--tg-border)',
              )}
            >
              <span
                className="relative flex items-center justify-center overflow-hidden rounded-[14px]"
                style={{ height: phone ? 84 : 96 }}
              >
                <VibeScene vibe={k} night={night} motion={settings.motion} still={!on || g.still} />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[14px]"
                  style={{ boxShadow: `inset 0 0 0 1px ${night ? 'rgba(255,255,255,.08)' : 'rgba(11,16,32,.08)'}` }}
                />
                <span
                  aria-hidden="true"
                  className="relative text-[22px] font-light tracking-[-0.03em] tabular-nums"
                  style={{
                    color: night ? '#FFFFFF' : '#0B1020',
                    textShadow: night ? '0 2px 12px rgba(0,0,0,.55)' : '0 1px 10px rgba(255,255,255,.9)',
                  }}
                >
                  38:12
                </span>
                {on ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-(--tg-volt) text-(--tg-on-volt) shadow-[0_2px_8px_rgba(0,0,0,.3)]"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                ) : null}
              </span>
              <span className="flex flex-col gap-0.5 px-1 text-left">
                <strong className="text-[15px] font-semibold">{t(`vibe.${k}.n`)}</strong>
                <span className="text-[13px] leading-[1.45] text-(--tg-t2)">{t(`vibe.${k}.d`)}</span>
              </span>
            </RadioGroup.Item>
          );
        })}
      </RadioGroup.Root>
      <SecLabel>{t('vibes.motion')}</SecLabel>
      <ToggleGroup.Root
        type="single"
        value={settings.motion}
        onValueChange={(v) => v && g.a.setMotion(v as TVibeMotion)}
        aria-label={t('vibes.motion')}
        className="flex gap-0.5 rounded-[16px] border border-(--tg-border) bg-(--tg-s1) p-1"
      >
        {MOTIONS.map(([m, Icon]) => (
          <ToggleGroup.Item
            key={m}
            value={m}
            className={cn(
              SEG_ITEM,
              'inline-flex items-center justify-center gap-1.5',
              settings.motion === m
                ? 'bg-(--tg-s3) font-bold text-(--tg-text) shadow-[inset_0_0_0_1px_var(--tg-border-hi)]'
                : 'bg-transparent font-semibold text-(--tg-t2)',
            )}
          >
            <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
            {t(`vibes.${m}`)}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
      <Note>{t('vibes.note')}</Note>
    </PanelBody>
  );
}

const SWATCHES = ['#3DF58E', '#B8F25A', '#FFB547', '#7CBBFF', '#C1B1FE', '#FF8FB1', '#FF6A3D'] as const;

// Face studio is free: an accent for any face and the strength of the room glow. Status colours never change.
export function StudioPanel() {
  const g = useGlance();
  const { t } = g;
  const studio = g.pro.studio;
  const lamp = studio.lamp || '#3DF58E';
  return (
    <>
      <PanelBody>
        <div
          className="flex justify-center rounded-[22px] border border-(--tg-border) py-5"
          style={{ background: 'var(--tg-studio)' }}
        >
          <Face
            face={g.face}
            theme={g.faceTheme}
            state="running"
            remain={2292}
            total={3600}
            nowSec={39828}
            size={240}
            bare
            lamp={lamp}
          />
        </div>
        <SecLabel>{t('studio.accent')}</SecLabel>
        <RadioGroup.Root
          value={lamp}
          onValueChange={(v) => pro.setStudio({ lamp: v as `#${string}` })}
          aria-label={t('studio.accent')}
          className="flex flex-wrap gap-2.5 p-1"
        >
          {SWATCHES.map((col, i) => (
            <RadioGroup.Item
              key={col}
              value={col}
              aria-label={t(`studio.swatch${i}`)}
              className="tg-btn size-11 rounded-full border-0"
              style={{
                background: col,
                boxShadow:
                  lamp === col ? `0 0 0 3px var(--tg-bg), 0 0 0 5px ${col}` : 'inset 0 0 0 1px rgba(0,0,0,.15)',
              }}
            />
          ))}
        </RadioGroup.Root>
        <SecLabel>{t('studio.glow')}</SecLabel>
        <Slider.Root
          value={[studio.glow]}
          onValueChange={([v]) => pro.setStudio({ glow: v ?? 70 })}
          min={0}
          max={100}
          step={5}
          aria-label={t('studio.glow')}
          className="relative mx-1 my-[3px] flex h-11 touch-none items-center select-none"
        >
          <Slider.Track className="relative h-2 grow rounded-full bg-(--tg-s3)">
            <Slider.Range className="absolute h-full rounded-full bg-[linear-gradient(90deg,var(--tg-violet),#C1B1FE)]" />
          </Slider.Track>
          <Slider.Thumb className="tg-btn block size-[26px] rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,.35),0_0_0_4px_var(--tg-violet-soft2)]" />
        </Slider.Root>
        <Note>{t('studio.note')}</Note>
      </PanelBody>
      <PanelFoot
        primary={{
          label: t('studio.save'),
          go: () => {
            pro.saveStudio();
            g.a.close();
          },
        }}
        secondary={{
          label: t('studio.reset'),
          go: () => {
            pro.setStudio({ lamp: '', glow: 70 });
            pro.saveStudio();
          },
        }}
      />
    </>
  );
}
