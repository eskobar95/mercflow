import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { forwardRef, type ComponentPropsWithoutRef } from "react"

import { ENTER_EASE } from "@/constants/motion"
import { cn } from "@/lib/cn"

import { overlayPanelClass } from "./formStyles"

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent(
  { className, sideOffset = 4, ...rest },
  ref,
) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          overlayPanelClass,
          "z-dropdown min-w-40 overflow-hidden p-1",
          "origin-[var(--radix-dropdown-menu-content-transform-origin)]",
          "data-[state=open]:scale-100 data-[state=open]:opacity-100",
          "data-[state=closed]:scale-[0.97] data-[state=closed]:opacity-0",
          "transition-[transform,opacity] duration-150 motion-reduce:transition-none",
          className,
        )}
        style={{ transitionTimingFunction: ENTER_EASE }}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  )
})

export { DropdownMenuItem } from "./DropdownMenuItem"
export { DropdownMenuSeparator } from "./DropdownMenuSeparator"
