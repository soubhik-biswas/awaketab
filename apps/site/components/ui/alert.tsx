import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const alertVariants = cva(
  'group/alert relative grid w-full grid-cols-[0_1fr_auto] items-start gap-y-0.5 rounded-md border px-3.5 py-3 text-[13px] has-[>svg]:grid-cols-[20px_1fr_auto] has-[>svg]:gap-x-3 [&>svg]:row-span-2 [&>svg]:size-5 [&>svg]:translate-y-px [&>svg]:[stroke-width:1.75]',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-foreground',
        info: 'border-info-soft bg-info-soft text-info',
        success: 'border-accent bg-accent text-lamp',
        paused: 'border-warning-soft bg-warning-soft text-warning',
        refused: 'border-destructive-soft bg-destructive-soft text-destructive',
        destructive: 'border-destructive-soft bg-destructive-soft text-destructive',
        ended: 'border-ended-soft bg-ended-soft text-ended',
      },
      emphasis: {
        soft: '',
        banner: 'items-center max-sm:items-start',
      },
    },
    compoundVariants: [
      { emphasis: 'banner', variant: 'info', className: 'border-info/25' },
      { emphasis: 'banner', variant: 'success', className: 'border-lamp/25' },
      { emphasis: 'banner', variant: 'paused', className: 'border-warning/25' },
      { emphasis: 'banner', variant: ['refused', 'destructive'], className: 'border-destructive/25' },
      { emphasis: 'banner', variant: 'ended', className: 'border-ended/25' },
    ],
    defaultVariants: {
      variant: 'default',
      emphasis: 'soft',
    },
  },
);

function Alert({
  className,
  variant,
  emphasis,
  role,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  const live = variant === 'refused' || variant === 'destructive' ? 'alert' : 'status';
  return (
    <div
      data-slot="alert"
      data-variant={variant ?? 'default'}
      role={role ?? live}
      className={cn(alertVariants({ variant, emphasis }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 min-h-4 text-[14px] leading-[1.35] font-bold text-current', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'col-start-2 grid justify-items-start gap-1 text-[13px] leading-[1.5] text-foreground [&_p]:leading-[1.5]',
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-action"
      className={cn('col-start-3 row-span-2 row-start-1 ml-3 self-center group-has-[>svg]/alert:ml-0', className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction, alertVariants };
