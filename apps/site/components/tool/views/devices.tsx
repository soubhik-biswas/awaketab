'use client';

import { Plus } from 'lucide-react';
import { DevicePresence, type IDevice } from '@/components/product/device-presence';
import { Button } from '@/components/ui/button';
import { pro, type TDeviceStatus } from '@/lib/tool/pro';
import { useTool } from '@/components/tool/context';
import { DASH_BTN, HELP } from '@/components/tool/kit';

export default function DevicesView() {
  const { pro: data, m } = useTool();
  const here: TDeviceStatus =
    m.state === 'running' || m.state === 'fallback' ? 'awake' : m.state === 'paused' ? 'paused' : 'idle';
  const devices: IDevice[] = data.devices.map((d) => ({
    id: d.id,
    name: d.name,
    kind: d.kind,
    identity: d.identity,
    status: d.current ? here : d.status,
    meta: d.current ? (here === 'awake' ? `This device · until ${m.endT}` : 'This device') : d.detail,
  }));
  return (
    <>
      <DevicePresence devices={devices} divider="bottom" />
      <Button type="button" variant="outline" className={DASH_BTN} onClick={() => void pro.addDevice()}>
        <Plus strokeWidth={2} aria-hidden="true" />
        Add a device
      </Button>
      <span className={HELP}>
        Pro · up to {data.maxDevices} devices. Starting or stopping on one device updates the others within a few
        seconds when online.
      </span>
    </>
  );
}
