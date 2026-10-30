'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Tabs as TabsPrimitive } from 'radix-ui';

function Tabs({ className, orientation = 'horizontal', ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn('group/tabs flex gap-3 data-[orientation=horizontal]:flex-col', className)}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  'group/tabs-list flex items-center text-muted-foreground-strong group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
  {
    variants: {
      variant: {
        default: 'gap-1 rounded-[11px] border bg-secondary p-[3px]',
        segmented: 'w-full gap-1 rounded-[12px] border bg-secondary p-[3px]',
        line: 'w-fit gap-1 rounded-none border-b bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-0 px-2.5 text-[14px] font-medium whitespace-nowrap text-muted-foreground-strong transition-[background-color,color,box-shadow] duration-fast ease-glide outline-none group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:text-muted-foreground data-[state=active]:font-bold data-[state=active]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        'group-data-[variant=default]/tabs-list:h-[38px] group-data-[variant=default]/tabs-list:rounded-[8px] group-data-[variant=default]/tabs-list:data-[state=active]:bg-raised group-data-[variant=default]/tabs-list:data-[state=active]:shadow-e1',
        'group-data-[variant=segmented]/tabs-list:h-11 group-data-[variant=segmented]/tabs-list:rounded-[9px] group-data-[variant=segmented]/tabs-list:data-[state=active]:bg-raised group-data-[variant=segmented]/tabs-list:data-[state=active]:shadow-[0_1px_2px_rgba(0,0,0,.2)]',
        'group-data-[variant=line]/tabs-list:h-11 group-data-[variant=line]/tabs-list:flex-none after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-lamp after:opacity-0 after:transition-opacity after:duration-fast group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn('flex-1 outline-none', className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
