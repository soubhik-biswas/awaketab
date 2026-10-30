'use client';

import { CircleCheck, Laptop, Monitor, Pause, Plus, Power, Smartphone, Tablet, WifiOff, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { pro, type IProDevice, type TDeviceKind, type TDeviceState, type TIdentity } from '@/lib/tool/pro';
import { useTool } from '@/components/tool/context';
import { DASH_BTN, HELP, ROW } from '@/components/tool/kit';

const KIND: Record<TDeviceKind, LucideIcon> = { laptop: Laptop, desktop: Monitor, tablet: Tablet, phone: Smartphone };

export const IDENTITY: Record<TIdentity, string> = {
  cobalt: 'bg-id-cobalt text-id-cobalt-foreground',
  grape: 'bg-id-grape text-id-grape-foreground',
  plum: 'bg-id-plum text-id-plum-foreground',
  bubblegum: 'bg-id-bubblegum text-id-bubblegum-foreground',
  denim: 'bg-id-denim text-id-denim-foreground',
  sand: 'bg-id-sand text-id-sand-foreground',
  slate: 'bg-id-slate text-id-slate-foreground',
  mauve: 'bg-id-mauve text-id-mauve-foreground',
};

const STATE: Record<TDeviceState, { label: string; icon: LucideIcon; badge: string; ring: string }> = {
  awake: { label: 'Awake', icon: CircleCheck, badge: 'bg-accent text-lamp', ring: 'var(--lamp)' },
  paused: { label: 'Paused', icon: Pause, badge: 'bg-warning-soft text-warning', ring: 'var(--warning)' },
  idle: { label: 'Not awake', icon: Power, badge: 'bg-secondary text-muted-foreground-strong', ring: 'var(--input)' },
  offline: { label: 'Offline', icon: WifiOff, badge: 'bg-secondary text-muted-foreground-strong', ring: 'var(--border)' },
};

export default function DevicesView() {
  const { pro: data, m } = useTool();
  const thisState: TDeviceState = m.state === 'running' || m.state === 'fallback' ? 'awake' : m.state === 'paused' ? 'paused' : 'idle';
  const devices: IProDevice[] = data.devices.map((d) =>
    d.current ? { ...d, state: thisState, detail: thisState === 'awake' ? `This device · until ${m.endT}` : 'This device' } : d,
  );
  const awake = devices.filter((d) => d.state === 'awake').length;
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="flex" aria-hidden="true">
          {devices.map((d, i) => {
            const Icon = KIND[d.kind];
            return (
              <span
                key={d.id}
                className={cn('inline-flex size-10 items-center justify-center rounded-full', IDENTITY[d.identity], i > 0 && '-ml-2.5')}
                style={{ boxShadow: `0 0 0 3px var(--card), 0 0 0 5px ${STATE[d.state].ring}` }}
              >
                <Icon className="size-[18px]" strokeWidth={2} />
              </span>
            );
          })}
        </span>
        <span className="text-[14px] font-semibold">
          {awake} of {devices.length} devices awake
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {devices.map((d) => {
          const Icon = KIND[d.kind];
          const st = STATE[d.state];
          const StIcon = st.icon;
          return (
            <li key={d.id} className={ROW}>
              <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-[10px]', IDENTITY[d.identity])}>
                <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[14px] font-semibold">{d.name}</span>
                <span className={HELP}>{d.detail}</span>
              </span>
              <span className={cn('inline-flex h-[26px] items-center gap-[5px] rounded-full px-[9px] text-[12px] font-semibold whitespace-nowrap', st.badge)}>
                <StIcon className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
                {st.label}
              </span>
            </li>
          );
        })}
      </ul>
      <Button type="button" variant="outline" className={DASH_BTN} onClick={() => void pro.addDevice()}>
        <Plus strokeWidth={2} aria-hidden="true" />
        Add a device
      </Button>
      <span className={HELP}>
        Pro · up to {data.maxDevices} devices. Starting or stopping on one device updates the others within a few seconds when online.
      </span>
    </>
  );
}
