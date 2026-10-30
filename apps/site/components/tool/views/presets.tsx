'use client';

import { ChevronRight, Plus } from 'lucide-react';
import { faceName } from '@/components/face';
import { EmptyState } from '@/components/product/empty-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { lengthWords } from '@/lib/tool/clock';
import { SAMPLE_PRESETS } from '@/lib/tool/presets';
import { useTool } from '@/components/tool/context';
import { BTN, DASH_BTN, HELP, PRESET_ICONS } from '@/components/tool/kit';

export default function PresetsView() {
  const { presets, ui, m, night, a } = useTool();
  const list = ui.qa.emptyPresets ? [] : ui.qa.samples && presets.length === 0 ? SAMPLE_PRESETS : presets;
  if (list.length === 0)
    return (
      <EmptyState
        scene="noitems"
        sceneTheme={night ? 'dark' : 'light'}
        sceneWidth={240}
        title="No saved presets yet"
        description="A preset remembers a length, a face and a sound. Save one from any running session."
        action={
          <Button type="button" onClick={a.savePreset} className={BTN}>
            <Plus strokeWidth={2} aria-hidden="true" />
            Save current as preset
          </Button>
        }
      />
    );
  return (
    <>
      {list.map((p, i) => {
        const on = p.totalSec === m.total;
        const Icon = PRESET_ICONS[p.icon];
        const meta = [p.totalSec === 0 ? 'No end' : lengthWords(p.totalSec), faceName(p.face), p.totalSec === 0 ? null : p.chime ? 'chime' : 'silent']
          .filter(Boolean)
          .join(' · ');
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={on}
            aria-keyshortcuts={i < 9 ? String(i + 1) : undefined}
            onClick={() => a.applyPreset(p)}
            className={cn(
              'box-border flex min-h-[60px] w-full shrink-0 cursor-pointer items-center gap-3 rounded-[16px] px-3 py-2 text-left text-foreground transition-colors duration-glide ease-glide',
              on ? 'border-2 border-lamp bg-accent' : 'border border-border bg-secondary hover:bg-surface-3',
            )}
          >
            <span
              className={cn(
                'inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] border',
                on ? 'border-lamp bg-lamp text-lamp-foreground' : 'border-border bg-card text-foreground',
              )}
            >
              <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
              <span className="text-[15px] font-semibold">{p.label}</span>
              <span className={HELP}>{meta}</span>
            </span>
            <ChevronRight className="size-[18px] shrink-0 text-muted-foreground-strong" strokeWidth={2} aria-hidden="true" />
          </button>
        );
      })}
      <Button type="button" variant="outline" onClick={a.savePreset} className={DASH_BTN}>
        <Plus strokeWidth={2} aria-hidden="true" />
        Save current as preset
      </Button>
    </>
  );
}
