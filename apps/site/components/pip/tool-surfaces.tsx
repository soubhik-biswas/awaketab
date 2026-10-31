'use client';

import { PipLauncher } from '@/components/pip/pip-launcher';
import { WidgetSync } from '@/components/widgets/widget-sync';

// What the tool mounts once for the other surfaces: the widgets' sync and the mini clock, which the tool boards
// draw no button for, so it opens from the command palette through PIP_EVENT.
export function ToolSurfaces() {
  return (
    <>
      <WidgetSync />
      <PipLauncher hideButton />
    </>
  );
}
