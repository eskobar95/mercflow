import { cn } from "@/lib/cn"

import type { ActiveFilter, FilterCategory } from "./types"
import { OperatorDropdown, ValuePickerPopover } from "./primitives"

type FilterChipProps = {
  filter: ActiveFilter
  category: FilterCategory
  onOperatorChange: (op: ActiveFilter["operator"]) => void
  onValueToggle: (valueId: string) => void
  onRemove: () => void
}

export function FilterChip({
  filter,
  category,
  onOperatorChange,
  onValueToggle,
  onRemove,
}: FilterChipProps): JSX.Element {
  const valueLabels = filter.valueIds
    .map((id) => category.values.find((v) => v.id === id)?.label ?? id)
    .join(", ")

  return (
    <span
      className={cn(
        "inline-flex h-[26px] shrink-0 items-center gap-px",
        "rounded border border-border-default bg-surface-default",
        "text-xs ring-0 transition-shadow",
        "hover:border-border-strong",
      )}
    >
      <span className="select-none px-2 font-medium text-content-secondary">
        {category.label}
      </span>

      <span className="h-4 w-px shrink-0 bg-border-subtle" aria-hidden />

      <OperatorDropdown
        operator={filter.operator}
        operators={category.operators}
        onSelect={onOperatorChange}
      />

      <span className="h-4 w-px shrink-0 bg-border-subtle" aria-hidden />

      <ValuePickerPopover
        category={category}
        selectedIds={filter.valueIds}
        onToggle={onValueToggle}
      >
        <button
          type="button"
          className={cn(
            "max-w-[120px] truncate px-2 font-medium text-content-primary",
            "rounded transition-colors hover:bg-surface-subtle",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-strong",
          )}
          title={valueLabels}
        >
          {valueLabels || <span className="text-content-tertiary">choose…</span>}
        </button>
      </ValuePickerPopover>

      <button
        type="button"
        aria-label={`Remove ${category.label} filter`}
        className="flex h-full items-center px-1.5 text-content-tertiary transition-colors hover:text-content-primary"
        onClick={onRemove}
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
          <path
            d="M2 2l5 5M7 2L2 7"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </span>
  )
}
