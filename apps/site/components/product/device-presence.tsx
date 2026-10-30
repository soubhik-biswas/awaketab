import * as React from 'react';
import { cn } from 'cn';
import { CircleCheck, Laptop, Monitor, Pause, Power, Smartphone, Tablet, type LucideIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

export const IDENTITIES = ['cobalt', 'grape', 'plum', 'bubblegum', 'denim', 'sand', 'slate', 'mauve'] as const;
export type TIdentity = (typeof IDENTITIES)[number];
export type TDeviceKind = 'laptop' | 'desktop' | 'tablet' | 'phone';
export type TDeviceStatus = 'awake' | 'paused' | 'idle';

export interface IDevice {
  id: string;
  name: string;
  meta: string;
  kind: TDeviceKind;
  identity: TIdentity;
  status: TDeviceStatus;
}

export const IDENTITY_CLASSES: Record<TIdentity, string> = {
  cobalt: 'bg-id-cobalt text-id-cobalt-foreground',
  grape: 'bg-id-grape text-id-grape-foreground',
  plum: 'bg-id-plum text-id-plum-foreground',
  bubblegum: 'bg-id-bubblegum text-id-bubblegum-foreground',
  denim: 'bg-id-denim text-id-denim-foreground',
  sand: 'bg-id-sand text-id-sand-foreground',
  slate: 'bg-id-slate text-id-slate-foreground',
  mauve: 'bg-id-mauve text-id-mauve-foreground',
};

export function identityFor(index: number): TIdentity {
  return IDENTITIES[((index % IDENTITIES.length) + IDENTITIES.length) % IDENTITIES.length];
}

const KIND_ICON: Record<TDeviceKind, LucideIcon> = { laptop: Laptop, desktop: Monitor, tablet: Tablet, phone: Smartphone };

const STATUS: Record<TDeviceStatus, { label: string; icon: LucideIcon; badge: string; ring: string }> = {
  awake: { label: 'Awake', icon: CircleCheck, badge: 'bg-accent text-lamp', ring: 'var(--lamp)' },
  paused: { label: 'Paused', icon: Pause, badge: 'bg-warning-soft text-warning', ring: 'var(--warning)' },
  idle: { label: 'Not awake', icon: Power, badge: 'bg-secondary text-muted-foreground-strong', ring: 'var(--input)' },
};

export function DeviceAvatarStack({ devices, className }: { devices: IDevice[]; className?: string }) {
  return (
    <span className={cn('flex', className)} aria-hidden="true">
      {devices.map((device, index) => {
        const Icon = KIND_ICON[device.kind];
        return (
          <span
            key={device.id}
            className={cn(
              'inline-flex size-10 items-center justify-center rounded-full',
              IDENTITY_CLASSES[device.identity],
              index > 0 && '-ml-2.5',
            )}
            style={{ boxShadow: `0 0 0 3px var(--card), 0 0 0 5px ${STATUS[device.status].ring}` }}
          >
            <Icon className="size-[18px]" aria-hidden="true" />
          </span>
        );
      })}
    </span>
  );
}

export function DeviceStatusBadge({ status, label }: { status: TDeviceStatus; label?: string }) {
  const look = STATUS[status];
  const Icon = look.icon;
  return (
    <span
      className={cn(
        'inline-flex h-[26px] shrink-0 items-center gap-[5px] rounded-full px-[9px] text-[12px] font-semibold whitespace-nowrap',
        look.badge,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
      {label ?? look.label}
    </span>
  );
}

export function DeviceRow({ device, divider = 'top' }: { device: IDevice; divider?: 'top' | 'bottom' }) {
  const Icon = KIND_ICON[device.kind];
  return (
    <div
      data-slot="device-row"
      className={cn('flex min-h-[52px] items-center gap-2.5', divider === 'top' ? 'border-t' : 'border-b')}
    >
      <span
        className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-sm', IDENTITY_CLASSES[device.identity])}
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[14px] font-semibold text-foreground">{device.name}</span>
        <span className="text-[12px] leading-[1.45] text-muted-foreground-strong">{device.meta}</span>
      </span>
      <DeviceStatusBadge status={device.status} />
    </div>
  );
}

export interface IDevicePresenceProps extends React.ComponentProps<'div'> {
  devices: IDevice[];
  summary?: React.ReactNode;
  divider?: 'top' | 'bottom';
}

export function DevicePresence({ devices, summary, divider = 'top', className, ...props }: IDevicePresenceProps) {
  const awake = devices.filter((d) => d.status === 'awake').length;
  return (
    <div data-slot="device-presence" className={cn('flex flex-col gap-3', className)} {...props}>
      <div className="flex items-center gap-3">
        <DeviceAvatarStack devices={devices} />
        <span className="text-[14px] font-semibold text-foreground">
          {summary ?? `${awake} of ${devices.length} devices awake`}
        </span>
      </div>
      <div className="flex flex-col">
        {devices.map((device) => (
          <DeviceRow key={device.id} device={device} divider={divider} />
        ))}
      </div>
    </div>
  );
}

export function DevicePresenceSkeleton({ label = 'Loading devices', className }: { label?: string; className?: string }) {
  return (
    <div aria-busy="true" aria-label={label} className={cn('flex items-center gap-2.5', className)}>
      <Skeleton className="size-8 rounded-sm" />
      <span className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3 w-[60%]" />
        <Skeleton className="h-3 w-[40%]" />
      </span>
    </div>
  );
}

export type TPresenceMarkerKind = 'awake' | 'paused' | 'device';

export interface IPresenceMarkerProps extends React.ComponentProps<'span'> {
  kind: TPresenceMarkerKind;
  identity?: TIdentity;
}

export function PresenceMarker({ kind, identity, className, children, ...props }: IPresenceMarkerProps) {
  return (
    <span
      data-slot="presence-marker"
      data-kind={kind}
      className={cn(
        'inline-flex items-center gap-2 px-3.5 py-2 text-[15px] font-bold whitespace-nowrap',
        kind === 'awake' && 'rounded-full bg-accent text-lamp',
        kind === 'paused' && 'rounded-full border-2 border-warning text-warning',
        kind === 'device' &&
          cn('rounded-[4px_999px_999px_999px]', identity ? IDENTITY_CLASSES[identity] : 'bg-primary text-primary-foreground'),
        className,
      )}
      {...props}
    >
      {kind === 'awake' ? (
        <span aria-hidden="true" className="size-2.5 rounded-full bg-lamp shadow-[0_0_0_4px_var(--halo)]" />
      ) : null}
      {kind === 'paused' ? (
        <span aria-hidden="true" className="size-2.5 rounded-full border-2 border-warning" />
      ) : null}
      {children}
    </span>
  );
}
