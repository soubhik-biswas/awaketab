'use client';

import * as React from 'react';
import { cn } from 'cn';
import {
  ChefHat,
  ChevronRight,
  Coffee,
  Infinity as InfinityIcon,
  NotebookPen,
  Plus,
  Presentation,
  type LucideIcon,
} from 'lucide-react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';

import { EmptyState } from '@/components/product/empty-state';
import { Button } from '@/components/ui/button';

export interface IPreset {
  id: string;
  label: string;
  meta: string;
  icon: LucideIcon;
  seconds?: number;
}

export const DEFAULT_PRESETS: IPreset[] = [
  { id: 'presenting', label: 'Presenting', meta: '1 h', icon: Presentation, seconds: 3600 },
  { id: 'cooking', label: 'Cooking', meta: '45 min', icon: ChefHat, seconds: 2700 },
  { id: 'reading', label: 'Reading', meta: '30 min', icon: NotebookPen, seconds: 1800 },
  { id: 'break', label: 'Break', meta: '15 min', icon: Coffee, seconds: 900 },
  { id: 'until-stop', label: 'Until I stop', meta: '∞', icon: InfinityIcon, seconds: 0 },
];

export interface IPresetGroupProps {
  presets?: IPreset[];
  value?: string;
  onValueChange?: (id: string) => void;
  onCreate?: () => void;
  variant?: 'grid' | 'list';
  createLabel?: string;
  createMeta?: string;
  ariaLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

const tileBase =
  'inline-flex shrink-0 items-center justify-center border transition-colors duration-fast ease-glide group-aria-checked/preset:border-lamp group-aria-checked/preset:bg-lamp group-aria-checked/preset:text-lamp-foreground group-aria-pressed/preset:border-lamp group-aria-pressed/preset:bg-lamp group-aria-pressed/preset:text-lamp-foreground';

export function PresetGroup({
  presets = DEFAULT_PRESETS,
  value,
  onValueChange,
  onCreate,
  variant = 'grid',
  createLabel,
  createMeta = 'save current',
  ariaLabel = 'Presets',
  emptyTitle = 'No saved presets yet',
  emptyDescription = 'A preset remembers a length, a face and a sound. Save one from any running session.',
  className,
}: IPresetGroupProps) {
  if (presets.length === 0) {
    return (
      <EmptyState
        scene="noitems"
        title={emptyTitle}
        description={emptyDescription}
        size={variant === 'grid' ? 'compact' : 'panel'}
        className={className}
        action={
          onCreate ? (
            <Button onClick={onCreate} className={variant === 'list' ? 'text-[15px]' : undefined}>
              <Plus className={variant === 'list' ? 'size-[18px]' : undefined} aria-hidden="true" />
              {createLabel ?? (variant === 'grid' ? 'Create a preset' : 'Save current as preset')}
            </Button>
          ) : null
        }
      />
    );
  }

  if (variant === 'list') {
    return (
      <div
        data-slot="preset-group"
        className={cn('flex flex-col gap-4', className)}
        role="group"
        aria-label={ariaLabel}
      >
        {presets.map((preset) => {
          const Icon = preset.icon;
          const on = preset.id === value;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={on}
              onClick={() => onValueChange?.(preset.id)}
              className="group/preset flex min-h-[60px] w-full cursor-pointer items-center gap-3 rounded-[16px] border bg-secondary px-3 py-2 text-left text-foreground transition-colors duration-fast ease-glide outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-2 aria-pressed:border-lamp aria-pressed:bg-accent"
            >
              <span className={cn(tileBase, 'size-10 rounded-[12px] bg-card')}>
                <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{preset.label}</span>
                <span className="text-[12px] leading-[1.45] text-muted-foreground-strong">{preset.meta}</span>
              </span>
              <ChevronRight className="size-[18px] shrink-0 text-muted-foreground-strong" aria-hidden="true" />
            </button>
          );
        })}
        {onCreate ? (
          <Button
            variant="outline"
            onClick={onCreate}
            className="h-13 w-full gap-2 rounded-[16px] border-dashed text-[15px]"
          >
            <Plus className="size-[18px]" aria-hidden="true" />
            {createLabel ?? 'Save current as preset'}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <RadioGroupPrimitive.Root
      data-slot="preset-group"
      value={value}
      onValueChange={onValueChange}
      aria-label={ariaLabel}
      className={cn('grid grid-cols-2 gap-2', className)}
    >
      {presets.map((preset) => {
        const Icon = preset.icon;
        return (
          <RadioGroupPrimitive.Item
            key={preset.id}
            value={preset.id}
            className="group/preset flex min-h-14 min-w-0 cursor-pointer items-center gap-2.5 rounded-md border bg-secondary px-2.5 py-2 text-left text-foreground transition-colors duration-fast ease-glide outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=checked]:border-2 data-[state=checked]:border-lamp data-[state=checked]:bg-accent"
          >
            <span
              className={cn(
                tileBase,
                'size-[34px] rounded-sm bg-card group-data-[state=checked]/preset:border-lamp group-data-[state=checked]/preset:bg-lamp group-data-[state=checked]/preset:text-lamp-foreground',
              )}
            >
              <Icon className="size-[18px]" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[14px] font-semibold whitespace-nowrap">{preset.label}</span>
              <span className="font-mono text-[12px] text-muted-foreground-strong">{preset.meta}</span>
            </span>
          </RadioGroupPrimitive.Item>
        );
      })}
      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="flex min-h-14 min-w-0 cursor-pointer items-center gap-2.5 rounded-md border-[1.5px] border-dashed border-input bg-transparent px-2.5 py-2 text-left text-foreground transition-colors duration-fast ease-glide outline-none hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className={cn(tileBase, 'size-[34px] rounded-sm bg-card')}>
            <Plus className="size-[18px]" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[14px] font-semibold whitespace-nowrap">{createLabel ?? 'New preset'}</span>
            <span className="font-mono text-[12px] text-muted-foreground-strong">{createMeta}</span>
          </span>
        </button>
      ) : null}
    </RadioGroupPrimitive.Root>
  );
}
