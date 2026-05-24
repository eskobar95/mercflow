import * as PopoverPrimitive from "@radix-ui/react-popover"
import { forwardRef, type ComponentPropsWithoutRef } from "react"

import { ENTER_EASE } from "@/constants/motion"
import { cn } from "@/lib/cn"

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor
export const PopoverClose = PopoverPrimitive.Close

export const PopoverContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function PopoverContent({ className, align = "center", sideOffset = 6, ...rest }, ref) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-popover rounded-md border border-border-default bg-surface-raised p-3 shadow-md",
          "origin-[var(--radix-popover-content-transform-origin)]",
          "data-[state=open]:scale-100 data-[state=open]:opacity-100",
          "data-[state=closed]:scale-[0.97] data-[state=closed]:opacity-0",
          "transition-[transform,opacity] duration-150 motion-reduce:transition-none",
          className,
        )}
        style={{ transitionTimingFunction: ENTER_EASE }}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  )
})
