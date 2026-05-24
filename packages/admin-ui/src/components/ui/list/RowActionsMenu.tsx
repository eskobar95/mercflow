import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"

import type { ReactNode } from "react"

export type RowActionItem = {
  id: string
  label: string
  onSelect: () => void
  destructive?: boolean
}

type RowActionsMenuProps = {
  items: RowActionItem[]
  /** Accessible name for the trigger (e.g. "Row actions for {name}"). */
  "aria-label": string
  trigger?: ReactNode
}

const defaultTrigger = (
  <span className="text-content-tertiary" aria-hidden>
    ⋮
  </span>
)

/**
 * Row-scoped menu; keeps row actions in a `...` dropdown, not inline buttons.
 */
export function RowActionsMenu({
  items,
  "aria-label": ariaLabel,
  trigger = defaultTrigger,
}: RowActionsMenuProps): JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-sm font-medium text-content-secondary transition-[background-color,color,transform] duration-150 hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
          aria-label={ariaLabel}
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        >
          {trigger}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            destructive={item.destructive}
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
