import * as React from 'react';
import { cn } from 'cn';

const fieldClasses =
  'w-full min-w-0 rounded-sm border border-input bg-field px-3 text-[15px] text-foreground transition-[border-color,box-shadow] duration-fast ease-glide outline-none selection:bg-accent selection:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:shadow-[0_0_0_3px_var(--ring-soft)] focus-visible:outline-none disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground aria-invalid:border-2 aria-invalid:border-destructive aria-invalid:px-[11px] aria-invalid:shadow-[0_0_0_3px_var(--destructive-ring)]';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldClasses,
        'h-11 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-[14px] file:font-medium file:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { Input, fieldClasses };
