'use client';

import * as React from 'react';
import { cn } from 'cn';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';

import { Button } from '@/components/ui/button';

function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-scrim duration-base data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-fade',
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  size?: 'default' | 'sm';
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          'group/alert-dialog-content fixed left-[50%] z-50 flex w-[calc(100%-2rem)] translate-x-[-50%] flex-col text-foreground shadow-e3 outline-none data-[size=default]:top-[12vh] data-[size=default]:max-h-[80vh] data-[size=default]:max-w-[520px] data-[size=default]:gap-3.5 data-[size=default]:overflow-y-auto data-[size=default]:rounded-xl data-[size=default]:bg-sheet data-[size=default]:p-6 data-[size=sm]:top-[50%] data-[size=sm]:max-w-[340px] data-[size=sm]:translate-y-[-50%] data-[size=sm]:gap-3 data-[size=sm]:rounded-lg data-[size=sm]:bg-raised data-[size=sm]:p-5 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-fast data-[state=open]:animate-fade',
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-2 text-left has-data-[slot=alert-dialog-media]:items-start', className)}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="alert-dialog-footer" className={cn('flex flex-wrap justify-end gap-2', className)} {...props} />
  );
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        'text-[22px] leading-[1.2] font-extrabold tracking-[-0.02em] group-data-[size=sm]/alert-dialog-content:font-bold group-data-[size=sm]/alert-dialog-content:tracking-normal',
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-[14px] leading-[1.55] text-muted-foreground-strong', className)}
      {...props}
    />
  );
}

function AlertDialogMedia({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-md bg-destructive-soft text-destructive *:[svg:not([class*='size-'])]:size-[22px]",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<React.ComponentProps<typeof Button>, 'variant' | 'size'>) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Action data-slot="alert-dialog-action" className={cn(className)} {...props} />
    </Button>
  );
}

function AlertDialogCancel({
  className,
  variant = 'outline',
  size = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> &
  Pick<React.ComponentProps<typeof Button>, 'variant' | 'size'>) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" className={cn(className)} {...props} />
    </Button>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
