'use client';

import * as React from 'react';
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const WIDE_QUERY = '(min-width: 1024px)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function useWide() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true,
  );
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  const wide = useWide();
  const theme: ToasterProps['theme'] = resolvedTheme === 'light' ? 'light' : resolvedTheme ? 'dark' : 'system';

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position={wide ? 'bottom-right' : 'bottom-center'}
      expand
      gap={8}
      offset={{
        top: '24px',
        right: 'var(--toast-offset-right, 24px)',
        bottom: 'var(--toast-offset-bottom, 24px)',
        left: '24px',
      }}
      mobileOffset={{ top: '12px', right: '12px', bottom: 'var(--toast-offset-bottom-mobile, 88px)', left: '12px' }}
      icons={{
        success: <CircleCheck className="size-5 text-lamp" strokeWidth={1.75} />,
        info: <Info className="size-5 text-info" strokeWidth={1.75} />,
        warning: <TriangleAlert className="size-5 text-warning" strokeWidth={1.75} />,
        error: <CircleAlert className="size-5 text-destructive" strokeWidth={1.75} />,
        loading: <LoaderCircle className="size-5 animate-spinner" strokeWidth={2.25} />,
        close: <X className="size-4" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-center gap-2.5 rounded-[16px] border bg-pop py-2.5 pr-2 pl-3.5 font-sans text-foreground shadow-e2',
          content: 'flex min-w-0 flex-1 flex-col gap-px',
          title: 'text-[14px] font-bold',
          description: 'text-[12px] leading-[1.45] text-muted-foreground-strong',
          icon: 'flex shrink-0',
          actionButton:
            'inline-flex h-11 shrink-0 cursor-pointer items-center px-2 text-[15px] font-semibold text-lamp underline underline-offset-3',
          cancelButton:
            'inline-flex h-11 shrink-0 cursor-pointer items-center px-2 text-[15px] font-semibold text-muted-foreground-strong',
          closeButton:
            'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground-strong hover:bg-secondary',
        },
      }}
      style={{ '--width': '400px' } as React.CSSProperties}
      {...props}
    />
  );
};

export { Toaster };
