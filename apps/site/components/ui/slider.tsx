'use client';

import * as React from 'react';
import { cn } from 'cn';
import { Slider as SliderPrimitive } from 'radix-ui';

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        'relative flex h-11 w-full touch-none items-center select-none data-[disabled]:cursor-not-allowed data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-11 data-[orientation=vertical]:flex-col',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-surface-3 data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute rounded-full bg-lamp data-[disabled]:bg-input data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="relative block size-[22px] shrink-0 cursor-grab rounded-full after:absolute after:-inset-[11px] after:rounded-full border-2 border-lamp bg-card shadow-[0_1px_3px_rgba(0,0,0,.3)] transition-shadow duration-fast ease-glide outline-none focus-visible:shadow-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring active:cursor-grabbing data-[disabled]:cursor-not-allowed data-[disabled]:border-input dark:bg-foreground"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
