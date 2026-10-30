import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const chipVariants = cva(
  "inline-flex h-11 min-w-0 cursor-pointer items-center justify-center gap-1.5 border text-[14px] font-semibold whitespace-nowrap text-foreground transition-[background-color,border-color,color] duration-fast ease-glide outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-muted-foreground aria-pressed:border-2 aria-pressed:border-lamp aria-pressed:bg-accent aria-pressed:font-bold aria-pressed:text-lamp aria-checked:border-2 aria-checked:border-lamp aria-checked:bg-accent aria-checked:font-bold aria-checked:text-lamp [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      shape: {
        pill: 'rounded-full px-3',
        tile: 'rounded-[12px] px-2',
      },
      tone: {
        default: 'border-border bg-secondary hover:border-input hover:bg-surface-3',
        outline: 'border-input bg-transparent hover:bg-secondary',
      },
    },
    defaultVariants: {
      shape: 'pill',
      tone: 'default',
    },
  },
);

export interface IChipProps extends React.ComponentProps<'button'>, VariantProps<typeof chipVariants> {
  pressed?: boolean;
}

export function Chip({ className, shape, tone, pressed, type = 'button', ...props }: IChipProps) {
  return (
    <button
      type={type}
      data-slot="chip"
      aria-pressed={pressed}
      className={cn(chipVariants({ shape, tone }), className)}
      {...props}
    />
  );
}
