'use client';

import { toast } from 'sonner';
import { ProductToast, TOAST_DURATION, type IProductToastOptions } from '@/components/product/toasts';
import { Toaster } from '@/components/ui/sonner';
import { fill, type IToolChrome } from '@/lib/tool/chrome';

export const TOOL_TOASTER = 'tool';

// The tool's toasts sit centred just above the control bar on every device, as the boards draw them.
export function ToolToaster({ bottom, phoneBottom }: { bottom: number; phoneBottom: number }) {
  return (
    <Toaster
      id={TOOL_TOASTER}
      position="bottom-center"
      offset={{ top: '24px', right: '24px', bottom: `${bottom}px`, left: '24px' }}
      mobileOffset={{ top: '12px', right: '12px', bottom: `${phoneBottom}px`, left: '12px' }}
    />
  );
}

function show({ id, duration, ...options }: IProductToastOptions): string | number {
  const life = duration ?? (options.tone === 'error' ? Infinity : TOAST_DURATION);
  return toast.custom((toastId) => <ProductToast toastId={toastId} duration={life} {...options} />, {
    id,
    duration: Infinity,
    unstyled: true,
    toasterId: TOOL_TOASTER,
  });
}

export const toolToast = {
  show,
  extended: (c: IToolChrome, { until, minutes, onUndo }: { until: string; minutes: number; onUndo: () => void }) =>
    show({
      id: 'extended',
      tone: 'success',
      title: fill(c.tExt, { time: until }),
      description: fill(c.tExtD, { n: minutes }),
      actionLabel: c.undo,
      onAction: onUndo,
    }),
  lowTime: (
    c: IToolChrome,
    { endsAt, extendLabel, onExtend }: { endsAt: string; extendLabel: string; onExtend: () => void },
  ) =>
    show({
      id: 'low-time',
      tone: 'warning',
      title: c.tLow,
      description: fill(c.tLowD, { time: endsAt }),
      actionLabel: extendLabel,
      onAction: onExtend,
    }),
  ended: (
    c: IToolChrome,
    { endedAt, againLabel, onStartAgain }: { endedAt: string; againLabel: string; onStartAgain: () => void },
  ) =>
    show({
      id: 'ended',
      tone: 'ended',
      title: c.tabUp,
      description: fill(c.tUpD, { time: endedAt }),
      actionLabel: againLabel,
      onAction: onStartAgain,
      duration: Infinity,
    }),
  copied: (c: IToolChrome) =>
    show({
      id: 'copied',
      tone: 'success',
      title: c.copied,
      description: c.copiedD,
      actionLabel: c.done,
      onAction: () => undefined,
    }),
};
