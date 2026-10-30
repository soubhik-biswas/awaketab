import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const kbdVariants = cva(
  "pointer-events-none inline-flex w-fit items-center justify-center gap-1 font-mono font-normal whitespace-nowrap select-none [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default:
          'h-[22px] min-w-[22px] rounded-xs border border-b-2 bg-background px-1.5 text-[12px] text-muted-foreground-strong',
        soft: 'rounded-xs border bg-secondary px-1.5 py-0.5 text-[12px] text-muted-foreground-strong',
        key: 'h-[30px] min-w-[30px] rounded-[8px] border bg-secondary px-2 text-[13px] text-foreground shadow-[inset_0_-2px_0_var(--border)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Kbd({ className, variant, ...props }: React.ComponentProps<'kbd'> & VariantProps<typeof kbdVariants>) {
  return (
    <kbd
      data-slot="kbd"
      data-variant={variant ?? 'default'}
      className={cn(
        kbdVariants({ variant }),
        '[[data-slot=tooltip-content]_&]:h-auto [[data-slot=tooltip-content]_&]:min-w-0 [[data-slot=tooltip-content]_&]:rounded-[5px] [[data-slot=tooltip-content]_&]:border-b [[data-slot=tooltip-content]_&]:border-tip-kbd [[data-slot=tooltip-content]_&]:bg-transparent [[data-slot=tooltip-content]_&]:px-1.5 [[data-slot=tooltip-content]_&]:py-px [[data-slot=tooltip-content]_&]:text-current',
        className,
      )}
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <kbd data-slot="kbd-group" className={cn('inline-flex items-center gap-1', className)} {...props} />;
}

export { Kbd, KbdGroup, kbdVariants };
