'use client';

import type { CSSProperties, KeyboardEvent } from 'react';
import { Check } from 'lucide-react';
import { RadioGroup } from 'radix-ui';
import { cn } from 'cn';
import { Face } from './face';
import { FACE_IDS, isFaceId, type TFaceId, type TFaceTheme } from './model';
import { faceKind, faceName, type TFaceKind } from './registry';

export interface IFaceGridProps {
  selected: TFaceId;
  onSelect: (id: TFaceId) => void;
  theme: TFaceTheme;
  ids?: readonly TFaceId[];
  // The face's width in each tile; the tile adds 14 px each side.
  size?: number;
  columns?: number;
  // Off for small pickers: no name row under the face, each tile named by its aria-label.
  labels?: boolean;
  label?: string;
  className?: string;
}

// The gallery tile of the tool board: every face sits on the same glass tile, so cased and uncased faces read as one family.
const TILE = {
  night: {
    bg: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.025))',
    border: 'rgba(255,255,255,.09)',
    volt: '#3DF58E',
    soft: 'rgba(61,245,142,.14)',
    onVolt: '#04140A',
    glow: 'rgba(159,123,255,.10)',
    shadow: '0 18px 40px rgba(0,0,0,.35)',
    tag: '#A6AFC2',
  },
  light: {
    bg: '#FFFFFF',
    border: 'rgba(11,16,32,.09)',
    volt: '#117A3B',
    soft: 'rgba(17,122,59,.10)',
    onVolt: '#FFFFFF',
    glow: 'rgba(102,51,245,.05)',
    shadow: '0 14px 30px rgba(11,16,32,.06)',
    tag: '#4B5165',
  },
};

const KIND: Readonly<Record<TFaceKind, string>> = {
  digital: 'Digital',
  analog: 'Analog',
  ambient: 'Ambient',
};

// A gallery of faces as a radio group: the selected tile has a 2 px volt border, a 4 px halo and a check badge.
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
  const c = theme === 'light' ? TILE.light : TILE.night;
  const w = size + 28;

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
      className={cn('grid gap-4 p-2', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, ${w}px)` }}
    >
      {ids.map((id) => {
        const on = id === selected;
        const tile: CSSProperties = {
          background: c.bg,
          border: on ? `2px solid ${c.volt}` : `1px solid ${c.border}`,
          boxShadow: `${on ? `0 0 0 4px ${c.soft}, ` : ''}${c.shadow}`,
          color: theme === 'light' ? '#0B1020' : '#F2F4FA',
        };
        return (
          <RadioGroup.Item
            key={id}
            value={id}
            data-face={id}
            aria-label={faceName(id)}
            className="relative flex min-w-0 cursor-pointer flex-col items-stretch gap-2.5 overflow-hidden rounded-[24px] px-3.5 pt-3.5 pb-3 text-left leading-[normal] outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring"
            style={tile}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: Math.round(w * 0.9),
                height: Math.round(w * 0.9),
                background: `radial-gradient(closest-side, ${on ? c.soft : c.glow}, transparent)`,
              }}
            />
            <span aria-hidden="true" className="relative flex min-h-0 flex-1 items-center justify-center">
              <Face
                face={id}
                theme={theme}
                state="running"
                remain={2292}
                total={3600}
                nowSec={39_828}
                size={size}
                bare
              />
            </span>
            {labels && (
              <span className="relative flex min-w-0 items-baseline justify-between gap-2" aria-hidden="true">
                <span className="truncate text-[15px] font-bold">{faceName(id)}</span>
                <span className="font-mono text-[12px] whitespace-nowrap" style={{ color: c.tag }}>
                  {KIND[faceKind(id)]}
                </span>
              </span>
            )}
            {on && (
              <span
                aria-hidden="true"
                className="absolute top-3 right-3 flex size-[26px] items-center justify-center rounded-full"
                style={{ background: c.volt, color: c.onVolt }}
              >
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            )}
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}
