'use client';

import * as React from 'react';
import { cn } from 'cn';
import { XIcon } from 'lucide-react';
import { Dialog as SheetPrimitive } from 'radix-ui';

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-scrim duration-base data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-fade',
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  closeLabel = 'Close',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
  closeLabel?: string;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          'group/sheet fixed z-50 flex flex-col gap-3 bg-sheet text-foreground shadow-e3 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-fast data-[state=open]:animate-rise',
          side === 'right' && 'inset-y-0 right-0 h-full w-[380px] max-w-full gap-3.5 border-l px-[22px] py-5',
          side === 'left' && 'inset-y-0 left-0 h-full w-[380px] max-w-full gap-3.5 border-r px-[22px] py-5',
          side === 'top' && 'inset-x-0 top-0 h-auto rounded-b-xl px-4 pt-6 pb-2.5 md:px-7',
          side === 'bottom' &&
            'inset-x-0 bottom-0 h-auto max-h-[92dvh] rounded-t-xl px-4 pt-2.5 pb-6 md:inset-x-[60px] md:px-7',
          className,
        )}
        {...props}
      >
        {side === 'bottom' ? (
          <span
            data-slot="sheet-grabber"
            aria-hidden="true"
            className="h-[5px] w-10 shrink-0 self-center rounded-full bg-input"
          />
        ) : null}
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            aria-label={closeLabel}
            className="absolute top-5 right-3.5 inline-flex size-11 cursor-pointer items-center justify-center rounded-sm text-muted-foreground-strong transition-colors duration-glide ease-glide outline-none group-data-[side=bottom]/sheet:top-[27px] group-data-[side=bottom]/sheet:right-2 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring md:group-data-[side=bottom]/sheet:right-5"
          >
            <XIcon className="size-5" />
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex min-h-11 shrink-0 flex-col justify-center gap-1 pr-12', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-footer" className={cn('mt-auto flex flex-col gap-2', className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-[22px] leading-[1.2] font-extrabold tracking-[-0.02em] text-foreground', className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-[14px] leading-[1.5] text-muted-foreground-strong', className)}
      {...props}
    />
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
