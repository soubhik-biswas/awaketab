import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Slot } from 'radix-ui';

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border font-semibold whitespace-nowrap transition-colors duration-fast ease-glide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&>svg]:pointer-events-none [&>svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary-soft text-primary',
        pro: 'border-primary bg-primary-soft text-primary',
        awake: 'border-lamp bg-accent text-lamp',
        paused: 'border-warning bg-warning-soft text-warning',
        blocked: 'border-destructive bg-destructive-soft text-destructive',
        destructive: 'border-destructive bg-destructive-soft text-destructive',
        needsyou: 'border-info bg-info-soft text-info',
        info: 'border-info bg-info-soft text-info',
        ended: 'border-ended bg-ended-soft text-ended',
        secondary: 'border-border bg-secondary text-foreground',
        outline: 'border-input bg-transparent text-foreground',
        ghost: 'border-transparent bg-transparent text-foreground',
        link: 'border-transparent text-lamp underline-offset-4 [a&]:hover:underline',
      },
      size: {
        default: 'h-7 px-2.5 text-[13px]',
        sm: 'h-auto border-0 px-2 py-0.5 text-[12px] font-bold',
        status: 'h-[26px] gap-[5px] border-0 px-[9px] text-[12px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
