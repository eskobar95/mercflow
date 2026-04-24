import * as DropdownMenu from "@radix-ui/react-dropdown-menu"

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
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-content-secondary transition hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          aria-label={ariaLabel}
        >
          {trigger}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-dropdown min-w-44 rounded-md border border-border-default bg-surface-raised p-1 shadow-md"
          sideOffset={4}
          align="end"
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.id}
              className={
                item.destructive
                  ? "cursor-pointer rounded-sm px-2 py-1.5 text-sm text-content-danger outline-none data-[disabled]:text-content-disabled data-[highlighted]:bg-surface-subtle"
                  : "cursor-pointer rounded-sm px-2 py-1.5 text-sm text-content-primary outline-none data-[disabled]:text-content-disabled data-[highlighted]:bg-surface-subtle"
              }
              onSelect={() => {
                item.onSelect()
              }}
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
