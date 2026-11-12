'use client';

import { DevMini } from '@/components/pip/dev-mini';
import { PipLauncher } from '@/components/pip/pip-launcher';
import { WidgetSync } from '@/components/widgets/widget-sync';

// What the tool mounts once for the other surfaces: the widgets' sync and the mini clock, which opens by itself
// when the tab is left (where the browser allows), from its one-tap offer, or from the command palette (PIP_EVENT).
export function ToolSurfaces() {
  return (
    <>
      <WidgetSync />
      <PipLauncher hideButton inTool />
      {process.env.NODE_ENV === 'production' ? null : <DevMini />}
    </>
  );
}
