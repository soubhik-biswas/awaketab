'use client';

import * as React from 'react';
import { cn } from 'cn';
import type { LucideIcon } from 'lucide-react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';

export interface ISegmentOption {
  value: string;
  label: React.ReactNode;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface ISegmentedControlProps extends Omit<
  React.ComponentProps<typeof RadioGroupPrimitive.Root>,
  'children' | 'orientation'
> {
  options: ISegmentOption[];
}

export function SegmentedControl({ options, className, ...props }: ISegmentedControlProps) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="segmented-control"
      orientation="horizontal"
      className={cn('flex gap-1 rounded-[12px] border bg-secondary p-[3px]', className)}
      {...props}
    >
      {options.map(({ value, label, icon: Icon, disabled }) => (
        <RadioGroupPrimitive.Item
          key={value}
          value={value}
          disabled={disabled}
          className="inline-flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[9px] border-0 bg-transparent px-2 text-[14px] font-medium text-muted-foreground-strong transition-[background-color,color,box-shadow] duration-fast ease-glide outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:text-muted-foreground data-[state=checked]:bg-raised data-[state=checked]:font-bold data-[state=checked]:text-foreground data-[state=checked]:shadow-[0_1px_2px_rgba(0,0,0,.2)]"
        >
          {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
          {label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
