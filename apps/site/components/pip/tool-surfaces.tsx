'use client';

import { PipLauncher } from '@/components/pip/pip-launcher';
import { WidgetSync } from '@/components/widgets/widget-sync';
import { isLive, useWake } from '@/lib/wake';

export interface IToolSurfacesProps {
  bottom?: number;
  hidden?: boolean;
}

// What the tool mounts once for the other surfaces: the widgets' sync and, while a session runs, "Pop out mini
// clock" 28 px in from the stage's lower right corner, above the control bar.
export function ToolSurfaces({ bottom = 0, hidden = false }: IToolSurfacesProps) {
  const snap = useWake();
  return (
    <>
      <WidgetSync />
      <PipLauncher
        hideButton={hidden || !isLive(snap.state)}
        className="absolute right-7 z-[6]"
        style={{ bottom: bottom + 28 }}
      />
    </>
  );
}
