'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Toggle as TogglePrimitive } from 'radix-ui';

const toggleVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-1.5 border text-[14px] font-medium whitespace-nowrap text-foreground transition-[background-color,border-color,color] duration-fast ease-glide outline-none hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-muted-foreground data-[state=on]:border-lamp data-[state=on]:bg-accent data-[state=on]:font-bold data-[state=on]:text-lamp [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'border-transparent bg-transparent',
        outline: 'border-border bg-transparent',
      },
      size: {
        default: 'h-11 min-w-11 rounded-sm px-3',
        sm: 'h-9 min-w-9 rounded-[8px] px-2.5 text-[13px]',
        lg: 'h-13 min-w-13 rounded-md px-4 text-[15px]',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'default',
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root data-slot="toggle" className={cn(toggleVariants({ variant, size, className }))} {...props} />
  );
}

export { Toggle, toggleVariants };
