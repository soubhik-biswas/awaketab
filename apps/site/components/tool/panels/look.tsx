'use client';

import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { RadioGroup, Slider, ToggleGroup } from 'radix-ui';
import { Face } from '@/components/face';
import { cn } from '@/lib/utils';
import { MIX_KEYS, pro, type TMixKey, type TSoundMix } from '@/lib/tool/pro';
import { VIBES, type TVibe, type TVibeMotion } from '@/lib/tool/settings';
import { previewAmbient } from '@/lib/tool/sound';
import { isAwake } from '@/lib/wake';
import { useGlance } from '../context';
import { Note, SecLabel } from '../kit';
import { PanelBody, PanelFoot } from './shell';

const DARK_PREVIEW: Record<TVibe, string> = {
  aurora:
    'radial-gradient(circle at 25% 30%, rgba(61,245,142,.55), transparent 55%), radial-gradient(circle at 80% 80%, rgba(124,92,255,.6), transparent 55%), #07080D',
  night:
    'radial-gradient(circle at 78% 22%, rgba(233,221,180,.45), transparent 22%), radial-gradient(1.5px 1.5px at 20% 30%, #fff, transparent), radial-gradient(1.5px 1.5px at 60% 60%, #fff, transparent), radial-gradient(1px 1px at 40% 80%, #fff, transparent), linear-gradient(180deg, #050816, #0B1030)',
  rain: 'repeating-linear-gradient(102deg, transparent 0 9px, rgba(190,210,255,.35) 9px 10px, transparent 10px 18px), radial-gradient(circle at 70% 30%, rgba(124,187,255,.35), transparent 50%), #0A0F1A',
  sunset:
    'radial-gradient(circle at 50% 78%, #FFD08A 0 12%, transparent 13%), linear-gradient(180deg, #1A0B2E 0%, #5B1F5E 45%, #E0584F 75%, #FFB36B 100%)',
  lava: 'radial-gradient(circle at 25% 35%, rgba(61,245,142,.8), transparent 40%), radial-gradient(circle at 70% 30%, rgba(255,107,180,.8), transparent 40%), radial-gradient(circle at 55% 80%, rgba(124,92,255,.85), transparent 45%), #0A0A12',
  calm: 'linear-gradient(180deg, #0D0F15, #07080C)',
};

const LIGHT_PREVIEW: Record<TVibe, string> = {
  aurora:
    'radial-gradient(circle at 25% 30%, rgba(17,160,80,.35), transparent 55%), radial-gradient(circle at 80% 80%, rgba(102,51,245,.30), transparent 55%), #EEF0F8',
  night:
    'radial-gradient(circle at 78% 22%, rgba(214,180,90,.55), transparent 20%), linear-gradient(180deg, #E4E8F6, #CFD6EE)',
  rain: 'repeating-linear-gradient(102deg, transparent 0 9px, rgba(60,90,160,.18) 9px 10px, transparent 10px 18px), radial-gradient(circle at 70% 30%, rgba(28,100,184,.18), transparent 50%), #E8EDF6',
  sunset:
    'radial-gradient(circle at 50% 78%, #FFD08A 0 12%, transparent 13%), linear-gradient(180deg, #FBE3D6 0%, #F9C6B4 55%, #F7A98E 100%)',
  lava: 'radial-gradient(circle at 25% 35%, rgba(17,180,90,.45), transparent 42%), radial-gradient(circle at 70% 30%, rgba(230,80,160,.40), transparent 42%), radial-gradient(circle at 55% 80%, rgba(102,51,245,.40), transparent 46%), #F3F2F8',
  calm: 'linear-gradient(180deg, #F6F6FA, #ECECF3)',
};

const MOTIONS: TVibeMotion[] = ['still', 'calm', 'lively'];

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
                style={{ height: phone ? 84 : 96, background: night ? DARK_PREVIEW[k] : LIGHT_PREVIEW[k] }}
              >
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
                    textShadow: night ? '0 2px 12px rgba(0,0,0,.4)' : '0 1px 8px rgba(255,255,255,.7)',
                  }}
                >
                  38:12
                </span>
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
        {MOTIONS.map((m) => (
          <ToggleGroup.Item
            key={m}
            value={m}
            className={cn(
              SEG_ITEM,
              settings.motion === m
                ? 'bg-(--tg-s3) font-bold text-(--tg-text)'
                : 'bg-transparent font-semibold text-(--tg-t2)',
            )}
          >
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
          className="relative mx-1 my-3 flex h-[26px] touch-none items-center select-none"
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

const MIX_EMOJI: Record<TMixKey, string> = { rain: '🌧️', cafe: '☕', fire: '🔥', brown: '🌊' };

const MIXES: Array<[string, TSoundMix]> = [
  ['rainy', { rain: 60, cafe: 35, fire: 0, brown: 20 }],
  ['focus', { rain: 0, cafe: 0, fire: 0, brown: 60 }],
  ['fire', { rain: 15, cafe: 0, fire: 70, brown: 0 }],
  ['off', { rain: 0, cafe: 0, fire: 0, brown: 0 }],
];

const same = (a: TSoundMix, b: TSoundMix) => MIX_KEYS.every((k) => a[k] === b[k]);

// Ambient sound is free: four layers that play while the screen is awake and fade out when the session ends.
export function SoundPanel() {
  const g = useGlance();
  const { t } = g;
  const mix = g.pro.mix;
  const [heard, setHeard] = useState(false);
  const named = MIXES.find(([, m]) => same(m, mix))?.[0] ?? 'custom';
  const name = t(`sound.mix.${named}`);
  const on = g.settings.ambientOn;
  const playing = on && isAwake(g.st);
  const silent = named === 'off';
  return (
    <PanelBody>
      <div
        className="flex items-center gap-3.5 rounded-[20px] border border-(--tg-border) p-4"
        style={{ background: 'var(--tg-sound)' }}
      >
        <button
          type="button"
          onClick={() => {
            g.a.update({ ambientOn: !on });
            if (!on && !isAwake(g.st)) {
              previewAmbient(mix);
              setHeard(true);
            }
          }}
          aria-pressed={on}
          aria-label={on ? t('sound.turnOff') : t('sound.turnOn')}
          className="tg-btn flex size-[52px] flex-none items-center justify-center rounded-full border-0 bg-(--tg-violet) text-(--tg-on-violet) shadow-[0_10px_24px_color-mix(in_srgb,var(--tg-violet)_33%,transparent)]"
        >
          {on ? (
            <Pause className="size-[22px]" fill="currentColor" strokeWidth={0} aria-hidden="true" />
          ) : (
            <Play className="size-[22px]" fill="currentColor" strokeWidth={0} aria-hidden="true" />
          )}
        </button>
        <span className="flex flex-col gap-0.5">
          <strong className="text-[15px] font-semibold">
            {silent
              ? t('sound.silent')
              : playing
                ? t('sound.playing', { name })
                : on
                  ? t('sound.ready', { name })
                  : t('sound.off', { name })}
          </strong>
          <span className="text-[13px] leading-[1.45] text-(--tg-t2)">
            {on && !playing ? (heard ? t('sound.preview') : t('sound.waits')) : t('sound.fades')}
          </span>
        </span>
      </div>
      {MIX_KEYS.map((k) => (
        <div key={k} className="flex items-center gap-3.5 px-1 py-2.5">
          <span
            aria-hidden="true"
            className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-(--tg-s2) text-[20px]"
          >
            {MIX_EMOJI[k]}
          </span>
          <span className="flex flex-1 flex-col gap-2">
            <span className="flex justify-between">
              <strong className="text-[15px] font-semibold" id={`tg-mix-${k}`}>
                {t(`sound.${k}`)}
              </strong>
              <span className="font-mono text-[12px] text-(--tg-t2)">{mix[k]}%</span>
            </span>
            <Slider.Root
              value={[mix[k]]}
              onValueChange={([v]) => pro.setMix(k, v ?? 0)}
              min={0}
              max={100}
              step={5}
              aria-labelledby={`tg-mix-${k}`}
              className="relative flex h-5 touch-none items-center select-none"
            >
              <Slider.Track className="relative h-1.5 grow rounded-full bg-(--tg-s3)">
                <Slider.Range className="absolute h-full rounded-full bg-[linear-gradient(90deg,var(--tg-violet),#C1B1FE)]" />
              </Slider.Track>
              <Slider.Thumb className="tg-btn block size-5 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,.35)]" />
            </Slider.Root>
          </span>
        </div>
      ))}
      <SecLabel>{t('sound.mixes')}</SecLabel>
      <ToggleGroup.Root
        type="single"
        value={named}
        onValueChange={(v) => {
          const m = MIXES.find(([n]) => n === v)?.[1];
          if (!m) return;
          for (const k of MIX_KEYS) pro.setMix(k, m[k]);
        }}
        aria-label={t('sound.mixes')}
        className="flex flex-wrap gap-2"
      >
        {MIXES.map(([n]) => (
          <ToggleGroup.Item
            key={n}
            value={n}
            className={cn(
              'tg-btn inline-flex h-11 items-center rounded-full px-3.5 text-[14px] font-semibold',
              named === n
                ? 'border border-transparent bg-(--tg-text) text-(--tg-bg)'
                : 'border border-(--tg-border) bg-(--tg-s1) text-(--tg-text)',
            )}
          >
            {t(`sound.mix.${n}`)}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </PanelBody>
  );
}
