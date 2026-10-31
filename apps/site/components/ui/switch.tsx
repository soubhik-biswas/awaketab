'use client';

import * as React from 'react';
import { cn } from 'cn';
import { Switch as SwitchPrimitive } from 'radix-ui';

function Switch({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default';
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer group/switch relative inline-flex h-[26px] w-11 shrink-0 cursor-pointer items-center rounded-full border transition-[background-color,border-color] duration-fast ease-glide outline-none after:absolute after:inset-x-0 after:-inset-y-[9px] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring disabled:cursor-not-allowed data-[state=checked]:border-lamp data-[state=checked]:bg-lamp data-[state=unchecked]:border-input data-[state=unchecked]:bg-surface-3 disabled:data-[state=checked]:border-border disabled:data-[state=checked]:bg-secondary disabled:data-[state=unchecked]:border-border disabled:data-[state=unchecked]:bg-secondary',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none absolute top-[2px] left-[2px] block size-5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,.25)] transition-transform duration-fast ease-glide data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-lamp-foreground data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-card data-disabled:bg-border!',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
