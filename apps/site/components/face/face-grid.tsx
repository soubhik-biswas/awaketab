'use client';

import type { KeyboardEvent } from 'react';
import { RadioGroup } from 'radix-ui';
import { cn } from 'cn';
import { NIGHT_TILE } from './art';
import { Face } from './face';
import { FACE_IDS, isFaceId, type TFaceId, type TFaceTheme } from './model';
import { faceName } from './registry';

export interface IFaceGridProps {
  selected: TFaceId;
  onSelect: (id: TFaceId) => void;
  theme: TFaceTheme;
  ids?: readonly TFaceId[];
  // Thumbnail size: 92 desktop, 84 tablet landscape, 96 phone; the setup panel's six minis use 80 (72 tablet).
  size?: number;
  // 3 columns, 5 on tablet portrait.
  columns?: number;
  // Off for the setup panel's minis: no names under the tiles, each tile named by its aria-label.
  labels?: boolean;
  label?: string;
  className?: string;
}

const checked = 'border-2 border-lamp shadow-[0_0_0_3px_var(--halo)]';

// The faces sheet: every face as a compact live thumbnail of the same session; the selected one has a lamp border.
export function FaceGrid({
  selected,
  onSelect,
  theme,
  ids = FACE_IDS,
  size = 92,
  columns = 3,
  labels = true,
  label = 'Clock face',
  className,
}: IFaceGridProps) {
  const tile = theme === 'light' ? 'var(--card)' : NIGHT_TILE;

  // Left and Right step through the faces (roving focus); Up and Down move by a whole row.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const to = items[Math.min(items.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? columns : -columns)))];
    const id = to?.dataset.face;
    if (!to || !isFaceId(id)) return;
    to.focus();
    onSelect(id);
  };

  return (
    <RadioGroup.Root
      value={selected}
      onValueChange={(v) => {
        if (isFaceId(v)) onSelect(v);
      }}
      orientation="horizontal"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('grid', theme, labels ? 'gap-x-2 gap-y-2.5' : 'gap-2', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {ids.map((id) => {
        const on = id === selected;
        const thumb = <Face face={id} theme={theme} state="running" size={size} bare />;
        if (!labels)
          return (
            <RadioGroup.Item
              key={id}
              value={id}
              data-face={id}
              aria-label={faceName(id)}
              className={cn(
                'flex min-w-0 cursor-pointer items-center justify-center overflow-hidden rounded-md py-1 leading-[normal]',
                on ? checked : 'border border-border',
              )}
              style={{ background: tile, height: size + 10 }}
            >
              <span aria-hidden="true">{thumb}</span>
            </RadioGroup.Item>
          );
        return (
          <RadioGroup.Item
            key={id}
            value={id}
            data-face={id}
            className="flex min-w-0 cursor-pointer flex-col items-stretch gap-1 border-0 bg-transparent p-0 leading-[normal] text-foreground"
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex justify-center overflow-hidden rounded-md py-[3px]',
                on ? checked : 'border border-border',
              )}
              style={{ background: tile }}
            >
              {thumb}
            </span>
            <span
              className={cn(
                'truncate text-center text-[13px]',
                on ? 'font-bold text-lamp' : 'font-medium text-muted-foreground-strong',
              )}
            >
              {faceName(id)}
            </span>
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}
