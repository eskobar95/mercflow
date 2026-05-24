import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react"

import { ENTER_EASE } from "@/constants/motion"
import { cn } from "@/lib/cn"

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuGroup = DropdownMenuPrimitive.Group
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal

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
          "z-dropdown min-w-44 overflow-hidden rounded-md border border-border-default bg-surface-raised p-1 shadow-md",
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

export type DropdownMenuItemProps = ComponentPropsWithoutRef<
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
          "relative flex min-h-11 cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          "data-[highlighted]:bg-surface-subtle",
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

export const DropdownMenuLabel = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(function DropdownMenuLabel({ className, ...rest }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-xs font-semibold text-content-tertiary", className)}
      {...rest}
    />
  )
})

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

export type DropdownMenuOption = {
  id: string
  label: ReactNode
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

type SimpleDropdownMenuProps = {
  trigger: ReactNode
  items: DropdownMenuOption[]
  "aria-label": string
  align?: "start" | "center" | "end"
}

/** Composed dropdown for action menus — replaces ad-hoc RowActionsMenu styling. */
export function SimpleDropdownMenu({
  trigger,
  items,
  "aria-label": ariaLabel,
  align = "end",
}: SimpleDropdownMenuProps): JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild aria-label={ariaLabel}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            destructive={item.destructive}
            disabled={item.disabled}
            onSelect={() => {
              item.onSelect()
            }}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
