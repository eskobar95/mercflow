import { IconClose } from "@/components/ui/icons"
import { cn } from "@/lib/cn"

import type { ActiveFilter, FilterCategory } from "./types"
import { OperatorDropdown, StatusDot, ValuePickerPopover } from "./primitives"

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
  const selectedValues = filter.valueIds
    .map((id) => category.values.find((v) => v.id === id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v))

  const valueSummary =
    selectedValues.length > 2
      ? `${selectedValues.length} selected`
      : selectedValues.map((v) => v.label).join(", ")

  const singleTone =
    selectedValues.length === 1 ? selectedValues[0]?.tone : undefined

  return (
    <span
      className={cn(
        "mercflow-chip-in inline-flex h-7 shrink-0 items-center overflow-hidden rounded-md border border-border-default bg-surface-default",
        "text-xs text-content-primary transition-colors hover:border-border-strong",
      )}
    >
      <span className="select-none px-2 font-medium text-content-secondary">
        {category.label}
      </span>

      <span className="h-full w-px shrink-0 bg-border-subtle" aria-hidden />

      <OperatorDropdown
        operator={filter.operator}
        operators={category.operators}
        onSelect={onOperatorChange}
      />

      <span className="h-full w-px shrink-0 bg-border-subtle" aria-hidden />

      <ValuePickerPopover
        category={category}
        selectedIds={filter.valueIds}
        onToggle={onValueToggle}
      >
        <button
          type="button"
          className={cn(
            "inline-flex h-full max-w-filterChip items-center gap-1.5 px-2 font-medium text-content-primary",
            "transition-colors hover:bg-surface-subtle",
            "focus-visible:outline-none focus-visible:bg-surface-subtle",
          )}
          title={selectedValues.map((v) => v.label).join(", ")}
        >
          {singleTone ? <StatusDot tone={singleTone} /> : null}
          <span className="truncate">
            {valueSummary || <span className="text-content-tertiary">choose…</span>}
          </span>
        </button>
      </ValuePickerPopover>

      <span className="h-full w-px shrink-0 bg-border-subtle" aria-hidden />

      <button
        type="button"
        aria-label={`Remove ${category.label} filter`}
        className="flex h-full items-center px-1.5 text-content-tertiary transition-colors hover:bg-surface-subtle hover:text-content-primary"
        onClick={onRemove}
      >
        <IconClose size={12} />
      </button>
    </span>
  )
}
