import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { LoaderCircle } from 'lucide-react';
import { Slot } from 'radix-ui';

const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 border font-semibold whitespace-nowrap no-underline transition-[background-color,border-color,color,box-shadow,transform,text-decoration-thickness] duration-glide ease-glide outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:translate-y-0 disabled:cursor-not-allowed aria-disabled:translate-y-0 aria-disabled:cursor-not-allowed aria-busy:cursor-progress aria-busy:[&>svg:not([data-spinner])]:hidden [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'border-primary bg-primary text-primary-foreground hover:border-primary-hover hover:bg-primary-hover active:translate-y-px active:border-primary-press active:bg-primary-press active:shadow-[inset_0_2px_0_rgba(0,0,0,.18)]',
        lamp: 'border-lamp bg-lamp text-lamp-foreground hover:border-lamp-hover hover:bg-lamp-hover active:translate-y-px active:border-lamp-press active:bg-lamp-press active:shadow-[inset_0_2px_0_rgba(0,0,0,.18)]',
        secondary:
          'border-secondary bg-secondary text-foreground hover:border-surface-3 hover:bg-surface-3 active:translate-y-px active:border-border active:bg-border active:shadow-[inset_0_2px_0_rgba(0,0,0,.18)]',
        outline:
          'border-input bg-transparent text-foreground hover:bg-secondary active:translate-y-px active:border-surface-3 active:bg-surface-3',
        ghost:
          'border-transparent bg-transparent text-foreground hover:border-secondary hover:bg-secondary active:translate-y-px active:border-surface-3 active:bg-surface-3',
        destructive:
          'border-destructive bg-destructive text-on-danger hover:border-destructive-hover hover:bg-destructive-hover active:translate-y-px active:border-destructive-press active:bg-destructive-press active:shadow-[inset_0_2px_0_rgba(0,0,0,.18)]',
        link: 'border-transparent bg-transparent text-lamp underline decoration-1 underline-offset-4 hover:decoration-2 active:decoration-2',
      },
      size: {
        default: 'h-11 rounded-sm px-4 text-[14px]',
        xs: "h-6 gap-1 rounded-xs px-2 text-[12px] [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-9 rounded-[8px] px-3 text-[13px] after:absolute after:inset-x-0 after:-inset-y-1',
        lg: "h-13 rounded-md px-[22px] text-[16px] [&_svg:not([class*='size-'])]:size-[18px]",
        xl: "h-16 rounded-lg px-7 text-[18px] [&_svg:not([class*='size-'])]:size-5",
        stage: "h-13 gap-2 rounded-[16px] px-4 text-[15px] [&_svg:not([class*='size-'])]:size-[18px]",
        cta: "h-15 gap-2 rounded-[18px] px-[26px] text-[17px] font-bold [&_svg:not([class*='size-'])]:size-5",
        icon: "size-11 rounded-sm p-0 [&_svg:not([class*='size-'])]:size-5 [&_svg]:[stroke-width:1.75]",
        'icon-xs': "size-6 rounded-xs p-0 [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-9 rounded-[8px] p-0 after:absolute after:-inset-1',
        'icon-lg': "size-13 rounded-[16px] p-0 [&_svg:not([class*='size-'])]:size-5 [&_svg]:[stroke-width:1.75]",
      },
    },
    compoundVariants: [
      { variant: 'default', size: ['xl', 'cta'], className: 'shadow-[0_12px_32px_var(--primary-glow)]' },
      {
        variant: ['default', 'lamp', 'secondary', 'destructive'],
        className:
          'disabled:border-secondary disabled:bg-secondary disabled:text-muted-foreground disabled:shadow-none aria-disabled:border-secondary aria-disabled:bg-secondary aria-disabled:text-muted-foreground aria-disabled:shadow-none',
      },
      {
        variant: ['outline', 'ghost', 'link'],
        className:
          'disabled:border-transparent disabled:bg-transparent disabled:text-muted-foreground aria-disabled:border-transparent aria-disabled:bg-transparent aria-disabled:text-muted-foreground',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  loading = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && !asChild ? (
        <>
          <LoaderCircle data-spinner className="animate-spinner" strokeWidth={2.25} aria-hidden="true" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
