import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { forwardRef, type ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/cn"

export const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...rest }, ref) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-border-default", className)}
      {...rest}
    />
  )
})
