'use client';

import * as React from 'react';
import { cn } from 'cn';
import { Check } from 'lucide-react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';

export interface IFaceOption {
  id: string;
  name: string;
}

export interface IFaceSwitcherProps {
  faces: IFaceOption[];
  value: string;
  onValueChange: (id: string) => void;
  renderThumb: (id: string, selected: boolean) => React.ReactNode;
  variant?: 'grid' | 'mini';
  columns?: number;
  thumbSize?: number;
  check?: boolean;
  note?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

const plateClasses =
  'relative flex justify-center overflow-hidden rounded-md border bg-face-plate transition-[border-color,box-shadow] duration-fast ease-glide';
const plateOn = 'group-data-[state=checked]/face:border-2 group-data-[state=checked]/face:border-lamp group-data-[state=checked]/face:shadow-[0_0_0_3px_var(--halo)]';

export function FaceSwitcher({
  faces,
  value,
  onValueChange,
  renderThumb,
  variant = 'grid',
  columns = 3,
  thumbSize = 92,
  check = false,
  note = 'Faces change only how time is drawn. Status always shows as words and an icon too.',
  ariaLabel = 'Clock face',
  className,
}: IFaceSwitcherProps) {
  const mini = variant === 'mini';
  return (
    <div data-slot="face-switcher" className={cn('flex flex-col gap-4', className)}>
      <RadioGroupPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        aria-label={ariaLabel}
        orientation="horizontal"
        className={cn('grid', mini ? 'gap-2' : 'gap-x-2 gap-y-2.5')}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {faces.map((face) => {
          const selected = face.id === value;
          return (
            <RadioGroupPrimitive.Item
              key={face.id}
              value={face.id}
              aria-label={mini ? face.name : undefined}
              className={cn(
                'group/face min-w-0 cursor-pointer border-0 bg-transparent p-0 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                mini ? 'rounded-md' : 'flex flex-col items-stretch gap-1 rounded-md',
              )}
            >
              <span
                className={cn(plateClasses, plateOn, mini ? 'items-center py-1' : 'py-[3px]')}
                style={mini ? { height: thumbSize + 10 } : undefined}
              >
                {renderThumb(face.id, selected)}
                {check && selected ? (
                  <span className="absolute top-1.5 right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-lamp text-lamp-foreground">
                    <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
                  </span>
                ) : null}
              </span>
              {mini ? null : (
                <span className="truncate text-center text-[13px] font-medium text-muted-foreground-strong group-data-[state=checked]/face:font-bold group-data-[state=checked]/face:text-lamp">
                  {face.name}
                </span>
              )}
            </RadioGroupPrimitive.Item>
          );
        })}
      </RadioGroupPrimitive.Root>
      {note && !mini ? <span className="text-[12px] leading-[1.45] text-muted-foreground-strong">{note}</span> : null}
    </div>
  );
}
