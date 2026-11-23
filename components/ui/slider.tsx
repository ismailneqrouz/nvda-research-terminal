'use client';
import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/format';

export const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>>(
  ({ className, 'aria-label': ariaLabel, ...props }, ref) => (
    <SliderPrimitive.Root ref={ref} className={cn('relative flex w-full touch-none select-none items-center py-1.5', className)} {...props}>
      <SliderPrimitive.Track className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-line">
        <SliderPrimitive.Range className="absolute h-full bg-up/80" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb aria-label={ariaLabel} className="block h-3.5 w-3.5 rounded-full border border-up bg-bg shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up/50" />
    </SliderPrimitive.Root>
  ),
);
Slider.displayName = 'Slider';
