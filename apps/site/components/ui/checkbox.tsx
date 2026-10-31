'use client';

import * as React from 'react';
import { cn } from 'cn';
import { CheckIcon, MinusIcon } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer group/checkbox relative inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-xs border-[1.5px] border-input bg-field text-lamp-foreground transition-[background-color,border-color] duration-fast ease-glide outline-none after:absolute after:-inset-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary aria-invalid:border-destructive data-[state=checked]:border-lamp data-[state=checked]:bg-lamp data-[state=indeterminate]:border-lamp data-[state=indeterminate]:bg-lamp',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="grid place-content-center text-current">
        <CheckIcon className="size-3.5 group-data-[state=indeterminate]/checkbox:hidden" strokeWidth={3} />
        <MinusIcon className="hidden size-3.5 group-data-[state=indeterminate]/checkbox:block" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
