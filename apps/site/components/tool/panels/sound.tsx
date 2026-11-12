'use client';

import { useRef, useState } from 'react';
import {
  Activity,
  AudioLines,
  AudioWaveform,
  Bell,
  Brain,
  CloudLightning,
  CloudRain,
  Coffee,
  Droplets,
  Fan,
  Flame,
  Infinity as Endless,
  MoonStar,
  Pause,
  Piano,
  Play,
  Shuffle,
  Sparkles,
  TrainFront,
  Volume1,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { RadioGroup, Slider } from 'radix-ui';
import { cn } from '@/lib/utils';
import { previewAmbient } from '@/lib/tool/sound';
import { setLayer, setMaster, setMix, useSound, type TLayer, type TMix } from '@/lib/tool/sound-mix';
import { GROUPS, SCENES, sceneOf, shuffleMix, type TScene } from '@/lib/tool/sound-scenes';
import { isAwake } from '@/lib/wake';
import { useGlance } from '../context';
import { SecLabel } from '../kit';
import { PanelBody } from './shell';

const LAYER_ICON: Record<TLayer, LucideIcon> = {
  rain: CloudRain,
  ocean: Waves,
  stream: Droplets,
  wind: Wind,
  crickets: MoonStar,
  thunder: CloudLightning,
  cafe: Coffee,
  fire: Flame,
  train: TrainFront,
  fan: Fan,
  brown: AudioLines,
  pink: AudioWaveform,
  white: Activity,
  pad: Sparkles,
  keys: Piano,
  drone: Endless,
  bells: Bell,
};

const SCENE_ICON: Record<TScene, LucideIcon> = {
  focus: Brain,
  rainy: Coffee,
  train: TrainFront,
  ocean: Waves,
  fire: Flame,
  keys: Piano,
  storm: CloudLightning,
  night: MoonStar,
};

const RANGE = 'absolute h-full rounded-full bg-[linear-gradient(90deg,var(--tg-violet),#C1B1FE)]';
const THUMB = 'tg-btn block size-5 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,.35)]';

interface ILevel {
  value: number;
  onChange: (v: number) => void;
  labelledBy: string;
  // Under its label the slider keeps its 44 px target below the text; beside one it overlaps the row's padding.
  stacked?: boolean;
}

function Level({ value, onChange, labelledBy, stacked = false }: ILevel) {
  return (
    <Slider.Root
      value={[value]}
      onValueChange={([v]) => onChange(v ?? 0)}
      min={0}
      max={100}
      step={5}
      className={cn(
        'relative flex h-11 min-w-0 touch-none items-center select-none',
        stacked ? '-mt-1 -mb-3 w-full flex-none' : '-my-3 flex-1',
      )}
    >
      <Slider.Track className="relative h-1.5 grow rounded-full bg-(--tg-s3)">
        <Slider.Range className={RANGE} />
      </Slider.Track>
      <Slider.Thumb className={THUMB} aria-labelledby={labelledBy} aria-valuetext={`${value}%`} />
    </Slider.Root>
  );
}

// Sound is free: layers of nature, places, noise and generated music that play while the screen is awake.
export function SoundPanel() {
  const g = useGlance();
  const { t } = g;
  const { mix, master } = useSound();
  const [heard, setHeard] = useState(false);
  const last = useRef<Partial<TMix>>({});
  const on = g.settings.ambientOn;
  const awake = isAwake(g.st);
  const playing = on && awake;
  const scene = sceneOf(mix);
  const silent = GROUPS.every(([, keys]) => keys.every((k) => mix[k] === 0));
  const name = t(`sound.mix.${scene ?? 'custom'}`);
  const names = (m: TMix) =>
    GROUPS.flatMap(([, keys]) => keys.filter((k) => m[k] > 0))
      .map((k) => t(`sound.${k}`))
      .join(' · ');

  // Away from a session, a change plays for a few seconds so it can be heard.
  const listen = (m: TMix) => {
    if (awake) return;
    previewAmbient(m);
    setHeard(true);
  };
  const choose = (m: TMix) => {
    setMix(m);
    if (!on) g.a.update({ ambientOn: true });
    listen(m);
  };
  const level = (k: TLayer, v: number) => {
    setLayer(k, v);
    if (on) listen({ ...mix, [k]: v });
  };
  const toggle = (k: TLayer) => {
    if (mix[k] > 0) last.current[k] = mix[k];
    level(k, mix[k] > 0 ? 0 : (last.current[k] ?? 50));
  };

  const VolumeIcon = master === 0 ? VolumeX : master < 50 ? Volume1 : Volume2;
  return (
    <PanelBody>
      <div
        className="flex flex-col gap-3 rounded-[20px] border border-(--tg-border) p-4"
        style={{ background: 'var(--tg-sound)' }}
      >
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => {
              g.a.update({ ambientOn: !on });
              if (!on) listen(mix);
            }}
            aria-pressed={on}
            aria-label={on ? t('sound.turnOff') : t('sound.turnOn')}
            className="tg-btn flex size-[52px] flex-none items-center justify-center rounded-full border-0 bg-(--tg-violet) text-(--tg-on-violet) shadow-[0_10px_24px_color-mix(in_srgb,var(--tg-violet)_33%,transparent)]"
          >
            {on ? (
              <Pause className="size-[22px]" fill="currentColor" strokeWidth={0} aria-hidden="true" />
            ) : (
              <Play className="size-[22px] translate-x-px" fill="currentColor" strokeWidth={0} aria-hidden="true" />
            )}
          </button>
          <span className="flex min-w-0 flex-col gap-0.5" aria-live="polite">
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
              {silent
                ? t('sound.silentHint')
                : on && !playing
                  ? heard
                    ? t('sound.preview')
                    : t('sound.waits')
                  : t('sound.fades')}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3 border-t border-(--tg-border) pt-3">
          <VolumeIcon className="size-5 flex-none text-(--tg-t2)" strokeWidth={2} aria-hidden="true" />
          <span className="flex-none text-[14px] font-semibold" id="tg-sound-volume">
            {t('sound.volume')}
          </span>
          <Level value={master} onChange={setMaster} labelledBy="tg-sound-volume" />
          <span className="w-10 flex-none text-right font-mono text-[12px] text-(--tg-t2) tabular-nums">{master}%</span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <SecLabel>{t('sound.mixes')}</SecLabel>
        <button
          type="button"
          onClick={() => choose(shuffleMix(mix))}
          className="tg-btn inline-flex h-11 flex-none items-center gap-2 rounded-full border border-(--tg-border) bg-(--tg-s1) px-3.5 text-[14px] font-semibold text-(--tg-text)"
        >
          <Shuffle className="size-4" strokeWidth={2} aria-hidden="true" />
          {t('sound.shuffle')}
        </button>
      </div>
      <RadioGroup.Root
        value={scene ?? ''}
        onValueChange={(v) => {
          const m = SCENES.find(([n]) => n === v)?.[1];
          if (m) choose(m);
        }}
        aria-label={t('sound.mixes')}
        className="grid grid-cols-2 gap-2.5"
      >
        {SCENES.map(([n, m]) => {
          const Icon = SCENE_ICON[n];
          const picked = scene === n;
          return (
            <RadioGroup.Item
              key={n}
              value={n}
              className={cn(
                'tg-btn tg-tile flex min-h-16 items-center gap-3 rounded-[18px] bg-(--tg-s1) px-3 py-3 text-left text-(--tg-text)',
                picked
                  ? 'border-2 border-(--tg-violet) shadow-[0_0_0_4px_var(--tg-violet-soft)]'
                  : 'border border-(--tg-border)',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-10 flex-none items-center justify-center rounded-[12px]',
                  picked ? 'bg-(--tg-violet) text-(--tg-on-violet)' : 'bg-(--tg-violet-soft2) text-(--tg-violet)',
                )}
              >
                <Icon className="size-5" strokeWidth={2} />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <strong className="text-[14px] leading-[1.25] font-semibold">{t(`sound.mix.${n}`)}</strong>
                <span className="text-[12px] leading-[1.35] text-(--tg-t2)">{names(m)}</span>
              </span>
            </RadioGroup.Item>
          );
        })}
      </RadioGroup.Root>

      {GROUPS.map(([group, keys]) => {
        const count = keys.filter((k) => mix[k] > 0).length;
        return (
          <section key={group} aria-labelledby={`tg-sound-${group}`} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span id={`tg-sound-${group}`}>
                <SecLabel>{t(`sound.group.${group}`)}</SecLabel>
              </span>
              {count ? (
                <span className="font-mono text-[12px] text-(--tg-violet)">{t('sound.count', { n: count })}</span>
              ) : null}
            </div>
            <div className="flex flex-col overflow-hidden rounded-[18px] border border-(--tg-border) bg-(--tg-s1)">
              {keys.map((k) => {
                const Icon = LAYER_ICON[k];
                const live = mix[k] > 0;
                return (
                  <div
                    key={k}
                    className="flex items-center gap-3.5 px-3 py-2.5 [&+&]:border-t [&+&]:border-(--tg-border)"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(k)}
                      aria-pressed={live}
                      aria-label={t(`sound.${k}`)}
                      className={cn(
                        'tg-btn flex size-11 flex-none items-center justify-center rounded-[14px] border',
                        live
                          ? 'border-[color-mix(in_srgb,var(--tg-violet)_40%,transparent)] bg-(--tg-violet-soft2) text-(--tg-violet)'
                          : 'border-(--tg-border) bg-(--tg-s2) text-(--tg-t2)',
                      )}
                    >
                      <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
                    </button>
                    <span className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className="flex items-baseline justify-between gap-2">
                        <strong className="text-[15px] font-semibold" id={`tg-mix-${k}`}>
                          {t(`sound.${k}`)}
                        </strong>
                        <span
                          className={cn(
                            'flex-none font-mono text-[12px] tabular-nums',
                            live ? 'text-(--tg-text)' : 'text-(--tg-t2)',
                          )}
                        >
                          {live ? `${mix[k]}%` : t('sound.mix.off')}
                        </span>
                      </span>
                      <Level value={mix[k]} onChange={(v) => level(k, v)} labelledBy={`tg-mix-${k}`} stacked />
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </PanelBody>
  );
}
