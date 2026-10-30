import * as React from 'react';
import { cn } from 'cn';
import { BatteryWarning, BellRing, RefreshCw, TriangleAlert, WifiOff, type LucideIcon } from 'lucide-react';

import { alertActionClasses } from '@/components/product/status-alert';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export type TBannerKind = 'offline' | 'conflict' | 'update' | 'needsyou' | 'blocked';

export interface IBannerProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  kind: TBannerKind;
  title?: React.ReactNode;
  body?: React.ReactNode;
  actionLabel?: React.ReactNode;
  onAction?: () => void;
}

const BANNERS: Record<
  TBannerKind,
  { variant: 'info' | 'paused' | 'refused'; icon: LucideIcon; title: string; body: string; action?: string }
> = {
  offline: {
    variant: 'info',
    icon: WifiOff,
    title: 'You’re offline',
    body: 'AwakeTab keeps working. Sync resumes when you reconnect.',
  },
  conflict: {
    variant: 'paused',
    icon: TriangleAlert,
    title: 'Another tab is keeping this screen awake',
    body: 'Only one tab holds the lamp at a time.',
    action: 'Take over',
  },
  update: {
    variant: 'info',
    icon: RefreshCw,
    title: 'A new version is ready',
    body: 'Reload when it suits you — your session continues.',
    action: 'Reload',
  },
  needsyou: {
    variant: 'info',
    icon: BellRing,
    title: 'Tap to resume',
    body: 'The browser let go of the wake lock while you were in another app.',
    action: 'Resume',
  },
  blocked: {
    variant: 'refused',
    icon: BatteryWarning,
    title: 'Your screen may still sleep',
    body: 'Battery saver is on, so the browser refused the wake lock.',
    action: 'Fix it',
  },
};

export function Banner({ kind, title, body, actionLabel, onAction, className, ...props }: IBannerProps) {
  const def = BANNERS[kind];
  const Icon = def.icon;
  const label = actionLabel ?? def.action;
  return (
    <Alert
      data-slot="banner"
      data-kind={kind}
      variant={def.variant}
      emphasis="banner"
      className={cn('max-w-[640px] animate-rise', className)}
      {...props}
    >
      <Icon aria-hidden="true" />
      <AlertTitle>{title ?? def.title}</AlertTitle>
      <AlertDescription className="leading-[1.45]">{body ?? def.body}</AlertDescription>
      {label && onAction ? (
        <AlertAction>
          <Button variant="outline" className={cn(alertActionClasses, 'h-11 text-[14px]')} onClick={onAction}>
            {label}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
