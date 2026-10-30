'use client';

import * as React from 'react';
import { cn } from 'cn';

import { Switch } from '@/components/ui/switch';

export interface ISwitchRowProps extends Omit<
  React.ComponentProps<typeof Switch>,
  'children' | 'id' | 'aria-describedby'
> {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export function SwitchRow({ label, description, className, disabled, ...props }: ISwitchRowProps) {
  const id = React.useId();
  return (
    <div
      data-slot="switch-row"
      data-disabled={disabled || undefined}
      className={cn('flex min-h-[46px] w-full items-center gap-3', className)}
    >
      <Switch id={id} aria-describedby={description ? `${id}-d` : undefined} disabled={disabled} {...props} />
      <span className="flex min-w-0 flex-col gap-px">
        <label
          htmlFor={id}
          className={cn(
            'cursor-pointer text-[14px] font-semibold',
            disabled ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {label}
        </label>
        {description ? (
          <span id={`${id}-d`} className="text-[12px] leading-[1.45] text-muted-foreground-strong">
            {description}
          </span>
        ) : null}
      </span>
    </div>
  );
}
