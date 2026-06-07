import type { ReactNode } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { IconCheck, IconChevronDown } from "@/components/ui/icons"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"
import { cn } from "@/lib/cn"

import type { FilterCategory, FilterOperator, FilterValueTone } from "./types"

const toneDotClass: Record<FilterValueTone, string> = {
  neutral: "bg-content-tertiary",
  success: "bg-feedback-success",
  warning: "bg-feedback-warning",
  danger: "bg-feedback-danger",
  accent: "bg-accent",
}

export function StatusDot({ tone }: { tone: FilterValueTone }): ReactNode {
  return (
    <span
      aria-hidden
      className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDotClass[tone])}
    />
  )
}

// ── CheckRow ──────────────────────────────────────────────────────────────────

export function CheckRow({
  label,
  tone,
  active,
  onClick,
}: {
  label: string
  tone?: FilterValueTone
  active: boolean
  onClick: () => void
}): ReactNode {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={active}
      className={cn(
        "flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-sm",
        "text-content-secondary transition-colors hover:bg-surface-subtle hover:text-content-primary",
        "focus-visible:outline-none focus-visible:bg-surface-subtle",
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          active
            ? "border-interactive-primary bg-interactive-primary text-content-inverse"
            : "border-border-strong bg-surface-default",
        )}
        aria-hidden
      >
        {active ? <IconCheck size={10} strokeWidth={2.5} /> : null}
      </span>
      {tone ? <StatusDot tone={tone} /> : null}
      <span className={cn("truncate", active && "font-medium text-content-primary")}>
        {label}
      </span>
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
}): ReactNode {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-full items-center px-1.5 text-xs text-content-tertiary",
            "transition-colors hover:bg-surface-subtle hover:text-content-secondary",
            "focus-visible:outline-none focus-visible:bg-surface-subtle",
          )}
        >
          {operator}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="min-w-[120px]">
        {operators.map((op) => (
          <DropdownMenuItem
            key={op}
            className={cn(
              "!min-h-0 gap-2 px-2 py-1.5 text-sm",
              op === operator ? "font-medium text-content-primary" : "text-content-secondary",
            )}
            onSelect={() => onSelect(op)}
          >
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center" aria-hidden>
              {op === operator ? <IconCheck size={12} /> : null}
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
  children: ReactNode
}): ReactNode {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1" sideOffset={6}>
        <p className="px-2 pb-1 pt-1.5 text-2xs font-semibold uppercase tracking-wide text-content-tertiary">
          {category.label}
        </p>
        <div className="flex flex-col">
          {category.values.map((val) => (
            <CheckRow
              key={val.id}
              label={val.label}
              tone={val.tone}
              active={selectedIds.includes(val.id)}
              onClick={() => onToggle(val.id)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { IconChevronDown }
