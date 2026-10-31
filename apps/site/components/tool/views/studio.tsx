'use client';

import dynamic from 'next/dynamic';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { pro } from '@/lib/tool/pro';
import { useTool } from '@/components/tool/context';
import { BTN_PRIMARY_FULL, Group, HELP, SecLabel } from '@/components/tool/kit';
import { SLIDER } from '@/components/tool/views/sound';

const Face = dynamic(() => import('@/components/face').then((mod) => mod.Face), { ssr: false });

// Face studio accents are art colours, the same in every theme; status colours never change.
const SWATCHES: ReadonlyArray<['' | `#${string}`, string]> = [
  ['', 'Default green'],
  ['#3DF58E', 'Volt'],
  ['#B8F25A', 'Lime'],
  ['#FFB547', 'Amber'],
  ['#7CBBFF', 'Sky'],
  ['#C1B1FE', 'Violet'],
  ['#FF7DB8', 'Rose'],
  ['#FF6A3D', 'Ember'],
];
const CHECK_INK = '#0B1020';

export default function StudioView() {
  const { pro: data, settings, theme, night, m } = useTool();
  const hue = data.studio.lamp;
  const name = SWATCHES.find(([v]) => v === hue)?.[1] ?? 'Default green';
  return (
    <>
      <div
        className={cn(
          'flex shrink-0 justify-center rounded-[20px] border border-border py-1.5',
          night ? 'bg-face-plate' : 'bg-secondary',
        )}
      >
        <Face
          face={settings.face}
          lamp={hue || undefined}
          theme={theme}
          state="running"
          size={240}
          remain={m.indef ? m.elapsed : m.remain}
          total={m.indef ? 3600 : m.total}
          nowSec={m.nowSec}
          bare
          fmt={m.fmt}
        />
      </div>
      <Group label="Accent colour">
        <div role="radiogroup" aria-label="Accent colour" className="flex flex-wrap gap-2">
          {SWATCHES.map(([v, n]) => {
            const on = v === hue;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={n}
                title={n}
                onClick={() => pro.setStudio({ lamp: v })}
                className={cn(
                  'box-border inline-flex h-11 cursor-pointer items-center justify-center rounded-full p-0 text-foreground',
                  v
                    ? 'w-11 border border-black/15'
                    : 'w-[60px] border-[1.5px] border-dashed border-input bg-transparent',
                  on && 'shadow-[0_0_0_3px_var(--background),0_0_0_5px_var(--foreground)]',
                )}
                style={v ? { background: v } : undefined}
              >
                {on && v ? (
                  <Check className="size-[18px]" strokeWidth={3} color={CHECK_INK} aria-hidden="true" />
                ) : null}
                {!v ? <span className="text-[12px] font-bold">Auto</span> : null}
              </button>
            );
          })}
        </div>
        <span className={HELP}>{name}. Status colours never change — paused stays amber, blocked stays red.</span>
      </Group>
      <div className="flex flex-col gap-2">
        <span className="flex justify-between">
          <SecLabel>Room glow</SecLabel>
          <span className="font-mono text-[12px] text-muted-foreground-strong">{data.studio.glow}%</span>
        </span>
        <Slider
          aria-label="Room glow strength"
          min={0}
          max={100}
          step={5}
          value={[data.studio.glow]}
          onValueChange={([g]) => pro.setStudio({ glow: g ?? 70 })}
          className={SLIDER}
        />
      </div>
      <Button type="button" className={BTN_PRIMARY_FULL} onClick={() => void pro.saveStudio()}>
        <Check strokeWidth={2} aria-hidden="true" />
        Save as my face
      </Button>
      <span className={HELP}>Pro · saved faces sync to your other devices.</span>
    </>
  );
}
