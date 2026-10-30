'use client';

import { toast } from 'sonner';
import { ProductToast, TOAST_DURATION, type IProductToastOptions } from '@/components/product/toasts';
import { Toaster } from '@/components/ui/sonner';

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
  extended: ({ until, minutes, onUndo }: { until: string; minutes: number; onUndo: () => void }) =>
    show({
      id: 'extended',
      tone: 'success',
      title: `Awake until ${until}`,
      description: `Extended by ${minutes} minutes.`,
      actionLabel: 'Undo',
      onAction: onUndo,
    }),
  lowTime: ({ endsAt, onExtend }: { endsAt: string; onExtend: () => void }) =>
    show({
      id: 'low-time',
      tone: 'warning',
      title: '5 minutes left',
      description: `Ends at ${endsAt}.`,
      actionLabel: '+15 min',
      onAction: onExtend,
    }),
  ended: ({ endedAt, onStartAgain }: { endedAt: string; onStartAgain: () => void }) =>
    show({
      id: 'ended',
      tone: 'ended',
      title: 'Time’s up',
      description: `Ended at ${endedAt}. The screen can sleep again.`,
      actionLabel: 'Start again',
      onAction: onStartAgain,
      duration: Infinity,
    }),
  copied: () =>
    show({
      id: 'copied',
      tone: 'success',
      title: 'Link copied',
      description: 'Paste it anywhere. Your label is not included.',
      actionLabel: 'Done',
      onAction: () => undefined,
    }),
};
