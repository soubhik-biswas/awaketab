'use client';

import { AudioWaveform, CloudRain, Coffee, Flame, Play, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { MIX_KEYS, pro, type TMixKey } from '@/lib/tool/pro';
import type { TChimeKind } from '@/lib/tool/settings';
import { previewAmbient } from '@/lib/tool/sound';
import { useTool } from '@/components/tool/context';
import { BTN_FULL, Group, HELP, Segments } from '@/components/tool/kit';

const MIX: Record<TMixKey, { n: string; icon: LucideIcon }> = {
  rain: { n: 'Rain on the window', icon: CloudRain },
  cafe: { n: 'Café murmur', icon: Coffee },
  fire: { n: 'Fire crackle', icon: Flame },
  brown: { n: 'Brown noise', icon: AudioWaveform },
};

const CHIMES: ReadonlyArray<[TChimeKind, string]> = [
  ['two', 'Two notes'],
  ['bell', 'Bell'],
  ['off', 'Off'],
];

export const SLIDER = cn(
  'h-7 [&_[data-slot=slider-range]]:bg-lamp [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-lamp [&_[data-slot=slider-thumb]]:bg-card [&_[data-slot=slider-track]]:bg-surface-3',
);

export default function SoundView() {
  const { pro: data, settings, a } = useTool();
  return (
    <>
      <span className="text-[14px] leading-[1.5] text-muted-foreground-strong">
        Mix a soundscape that plays only while the screen is awake. It fades out the moment the session ends.
      </span>
      <div className="flex flex-col gap-4">
        {MIX_KEYS.map((k) => {
          const v = data.mix[k];
          const { n, icon: Icon } = MIX[k];
          return (
            <div key={k} className="flex min-h-[57px] items-center gap-3 border-b border-border">
              <span
                className={cn(
                  'inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] border',
                  v ? 'border-lamp bg-accent text-lamp' : 'border-border bg-secondary text-muted-foreground-strong',
                )}
              >
                <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex justify-between gap-2 text-[14px] font-semibold">
                  <span>{n}</span>
                  <span
                    className={cn(
                      'font-mono text-[12px] font-medium',
                      v ? 'text-lamp' : 'text-muted-foreground-strong',
                    )}
                  >
                    {v === 0 ? 'Off' : `${v}%`}
                  </span>
                </span>
                <Slider
                  aria-label={`${n} volume`}
                  min={0}
                  max={100}
                  step={5}
                  value={[v]}
                  onValueChange={([nv]) => pro.setMix(k, nv ?? 0)}
                  className={SLIDER}
                />
              </div>
            </div>
          );
        })}
      </div>
      <Group label="Chime at the end">
        <Segments
          label="Chime"
          options={CHIMES}
          value={settings.chime}
          onChange={(chime) => a.updateSettings({ chime })}
        />
      </Group>
      <Button type="button" variant="outline" className={BTN_FULL} onClick={() => previewAmbient(data.mix, 5)}>
        <Play strokeWidth={2} aria-hidden="true" />
        Preview for 5 seconds
      </Button>
      <span className={HELP}>Pro · sounds play from this device. Your system volume still applies.</span>
    </>
  );
}
