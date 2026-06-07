import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { forwardRef, type ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/cn"

type DropdownMenuItemProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Item
> & {
  destructive?: boolean
  inset?: boolean
}

export const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  function DropdownMenuItem(
    { className, destructive = false, inset = false, ...rest },
    ref,
  ) {
    return (
      <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(
          "relative flex min-h-8 cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          "data-[highlighted]:bg-accent-subtle",
          destructive
            ? "text-feedback-danger-content data-[highlighted]:bg-feedback-danger-subtle"
            : "text-content-primary",
          inset ? "pl-8" : "",
          className,
        )}
        {...rest}
      />
    )
  },
)
