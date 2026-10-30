'use client';

import * as React from 'react';
import { cn } from 'cn';
import { AlarmClock, Pause, Play, X } from 'lucide-react';

import { Chip } from '@/components/product/chip';
import { Button } from '@/components/ui/button';

interface IExtendOption {
  seconds: number;
  label: string;
}

const EXTEND_OPTIONS: IExtendOption[] = [
  { seconds: 300, label: '+5 min' },
  { seconds: 900, label: '+15 min' },
  { seconds: 1800, label: '+30 min' },
  { seconds: 3600, label: '+1 hour' },
];

export interface IExtendBarProps extends Omit<React.ComponentProps<'div'>, 'onPause'> {
  onExtend: (seconds: number) => void;
  onUntil?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  paused?: boolean;
  options?: IExtendOption[];
  label?: string;
  untilLabel?: string;
  pauseLabel?: string;
  resumeLabel?: string;
  stopLabel?: string;
  disabled?: boolean;
}

export function ExtendBar({
  onExtend,
  onUntil,
  onPause,
  onStop,
  paused = false,
  options = EXTEND_OPTIONS,
  label = 'Extend',
  untilLabel = 'Until…',
  pauseLabel = 'Pause',
  resumeLabel = 'Resume',
  stopLabel = 'Stop',
  disabled = false,
  className,
  ...props
}: IExtendBarProps) {
  const labelId = React.useId();
  return (
    <div data-slot="extend-bar" className={cn('flex flex-col gap-3', className)} {...props}>
      <span id={labelId} className="text-[13px] font-semibold text-foreground">
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Chip key={option.seconds} disabled={disabled} onClick={() => onExtend(option.seconds)}>
            {option.label}
          </Chip>
        ))}
        {onUntil ? (
          <Chip tone="outline" disabled={disabled} onClick={onUntil}>
            <AlarmClock aria-hidden="true" />
            {untilLabel}
          </Chip>
        ) : null}
      </div>
      {onPause || onStop ? (
        <div className="flex gap-2">
          {onPause ? (
            <Button variant="secondary" className="px-3.5" onClick={onPause}>
              {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
              {paused ? resumeLabel : pauseLabel}
            </Button>
          ) : null}
          {onStop ? (
            <Button variant="ghost" className="px-3.5" onClick={onStop}>
              <X aria-hidden="true" />
              {stopLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
