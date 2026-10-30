'use client';

import type { ReactNode } from 'react';
import {
  ChefHat,
  Coffee,
  Infinity as InfinityGlyph,
  MoonStar,
  NotebookPen,
  Presentation,
  Timer,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/product/segmented-control';
import { SwitchRow } from '@/components/product/switch-row';
import type { TPresetIcon } from '@/lib/tool/presets';

export const PRESET_ICONS: Record<TPresetIcon, LucideIcon> = {
  presentation: Presentation,
  chef: ChefHat,
  reading: NotebookPen,
  coffee: Coffee,
  infinity: InfinityGlyph,
  night: MoonStar,
  timer: Timer,
};

// The tool's button geometry from the design: 44 px, 10 px corners, 15 px semibold, 18 px icons.
export const BTN = 'h-11 gap-2 rounded-[10px] px-4 text-[15px] font-semibold [&_svg:not([class*=size-])]:size-[18px]';
export const BTN_FULL = cn(BTN, 'w-full shrink-0');
export const BTN_PRIMARY_FULL = cn(BTN, 'h-13 w-full shrink-0 rounded-[14px]');
export const BTN_DANGER_OUT =
  'h-11 gap-2 self-start rounded-[10px] border-destructive bg-transparent px-4 text-[15px] font-semibold text-destructive hover:bg-destructive-soft [&_svg:not([class*=size-])]:size-4';
export const DASH_BTN = cn(BTN, 'h-13 w-full rounded-[16px] border-dashed');
export const HELP = 'text-[12px] leading-[1.45] text-muted-foreground-strong';
const GROUP = 'flex flex-col gap-2';
export const SEC_LABEL = 'font-mono text-[12px] tracking-[.08em] text-muted-foreground-strong uppercase';
export const H3 = 'font-display text-[20px] font-extrabold tracking-[-0.02em] [font-stretch:112%]';
export const FIELD =
  'flex h-11 min-w-0 items-center gap-2 rounded-[10px] border border-input bg-field px-3 text-[15px] text-foreground';
export const LINK_BTN =
  'min-h-11 cursor-pointer border-0 bg-transparent px-0.5 text-[14px] font-semibold text-lamp underline underline-offset-3';
export const ROW = 'flex min-h-[52px] items-center gap-3 border-b border-border';
export const ROW_BTN = cn(
  ROW,
  'w-full cursor-pointer border-x-0 border-t-0 bg-transparent p-0 text-left text-foreground',
);
export const TILE =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-border bg-secondary';
export const KBD =
  'h-[22px] min-w-[22px] rounded-[6px] border border-b-2 border-border bg-background px-1.5 font-mono text-[12px] font-normal text-muted-foreground-strong';
export const PRO_CHIP = 'rounded-full bg-primary-soft px-2 py-0.5 text-[12px] font-bold text-primary';

export function SecLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn(SEC_LABEL, className)}>{children}</span>;
}

export function Group({ label, children, aside }: { label?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className={GROUP}>
      {label !== undefined && aside ? (
        <span className="flex items-baseline justify-between">
          <SecLabel>{label}</SecLabel>
          {aside}
        </span>
      ) : label !== undefined ? (
        <SecLabel>{label}</SecLabel>
      ) : null}
      {children}
    </div>
  );
}

export function CloseButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="-mr-2 size-11 rounded-[10px] text-muted-foreground-strong [&_svg]:size-5"
      onClick={onClick}
      aria-label={label}
    >
      <X strokeWidth={2} aria-hidden="true" />
    </Button>
  );
}

export function Segments<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: ReadonlyArray<[T, string]>;
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <SegmentedControl
      aria-label={label}
      value={value}
      onValueChange={(v) => {
        const hit = options.find(([k]) => k === v);
        if (hit) onChange(hit[0]);
      }}
      options={options.map(([v, text]) => ({ value: v, label: text }))}
    />
  );
}

export function SwitchLine({
  label,
  desc,
  on,
  onToggle,
}: {
  label: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
}) {
  return <SwitchRow label={label} description={desc} checked={on} onCheckedChange={onToggle} />;
}
