import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"
import { cn } from "@/lib/cn"

import type { FilterCategory, FilterOperator } from "./types"

// ── CheckRow ──────────────────────────────────────────────────────────────────

export function CheckRow({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}): JSX.Element {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 px-2.5 py-1 text-left text-xs text-content-primary hover:bg-surface-subtle"
      onClick={onClick}
    >
      <span
        className={cn(
          "flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
          active
            ? "border-accent bg-accent"
            : "border-border-strong bg-surface-default",
        )}
        aria-hidden
      >
        {active ? (
          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
            <path
              d="M1 3.5l2 2 3-3"
              stroke="white"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className={cn(active && "font-medium")}>{label}</span>
    </button>
  )
}

// ── OperatorDropdown ──────────────────────────────────────────────────────────

export function OperatorDropdown({
  operator,
  operators,
  onSelect,
}: {
  operator: FilterOperator
  operators: FilterOperator[]
  onSelect: (op: FilterOperator) => void
}): JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-0.5 rounded px-1.5 py-px",
            "text-2xs font-medium text-content-tertiary",
            "transition-colors hover:bg-surface-subtle hover:text-content-secondary",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-strong",
          )}
        >
          {operator}
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
            <path
              d="M1.5 3L4 5.5 6.5 3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="min-w-[100px] p-0.5">
        {operators.map((op) => (
          <DropdownMenuItem
            key={op}
            className={cn(
              "!min-h-0 cursor-pointer gap-1.5 px-2 py-1 text-xs",
              op === operator ? "font-semibold text-accent" : "text-content-primary",
            )}
            onSelect={() => onSelect(op)}
          >
            <span className="flex h-3 w-3 shrink-0 items-center justify-center" aria-hidden>
              {op === operator ? (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path
                    d="M1 4l2.5 2.5L7 1.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
            {op}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── ValuePickerPopover ────────────────────────────────────────────────────────

export function ValuePickerPopover({
  category,
  selectedIds,
  onToggle,
  children,
}: {
  category: FilterCategory
  selectedIds: string[]
  onToggle: (valueId: string) => void
  children: React.ReactNode
}): JSX.Element {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-40 p-0" sideOffset={4}>
        <div className="border-b border-border-subtle px-2.5 py-1.5">
          <span className="text-3xs font-semibold uppercase tracking-wider text-content-tertiary">
            {category.label}
          </span>
        </div>
        <div className="py-0.5">
          {category.values.map((val) => (
            <CheckRow
              key={val.id}
              label={val.label}
              active={selectedIds.includes(val.id)}
              onClick={() => onToggle(val.id)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
