import { type ReactNode, useMemo } from "react"

import { Select } from "@/components/ui/Select"
import { cn } from "@/lib/cn"

type CategoryOption = { id: string; name: string }

type CategoryPickerFieldProps = {
  options: CategoryOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

/**
 * Multi-category picker — selected categories render as removable pills, the rest
 * are added one at a time from a filtered Select (accessible alternative to a long
 * checkbox column).
 */
export function CategoryPickerField({ options, selectedIds, onChange }: CategoryPickerFieldProps): ReactNode {
  const nameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const option of options) {
      map.set(option.id, option.name)
    }
    return map
  }, [options])

  const remaining = options.filter((option) => !selectedIds.includes(option.id))

  return (
    <div className="space-y-2">
      {selectedIds.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {selectedIds.map((id) => (
            <li key={id}>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full bg-surface-subtle py-0.5 pl-2.5 pr-1",
                  "text-xs font-medium text-content-secondary ring-1 ring-inset ring-border-default",
                )}
              >
                {nameById.get(id) ?? id}
                <button
                  type="button"
                  aria-label={`Remove ${nameById.get(id) ?? id}`}
                  onClick={() => onChange(selectedIds.filter((entry) => entry !== id))}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-content-tertiary transition-colors duration-150 hover:bg-surface-default hover:text-content-primary"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {remaining.length > 0 ? (
        <Select
          value=""
          onValueChange={(id) => onChange([...selectedIds, id])}
          options={remaining.map((option) => ({ value: option.id, label: option.name }))}
          placeholder="Add a category…"
          aria-label="Add category"
        />
      ) : (
        <p className="text-xs text-content-tertiary">All categories added.</p>
      )}
    </div>
  )
}
