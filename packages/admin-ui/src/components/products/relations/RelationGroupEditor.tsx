import { type KeyboardEvent, type ReactNode, useState } from "react"

import type { RelationGroup } from "@/components/products/relations/relationAdapter"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/cn"

type RelationGroupEditorProps = {
  group: RelationGroup
  onChangeValues: (values: string[]) => void
  onRemove: () => void
}

/**
 * Edits one relation group. Scalar groups show a single field; list groups show
 * removable pills plus an input that commits on Enter. Mirrors the dynamic
 * relation-table UX (e.g. ingredients, brands) on top of `metadata`.
 */
export function RelationGroupEditor({ group, onChangeValues, onRemove }: RelationGroupEditorProps): ReactNode {
  const [pending, setPending] = useState("")

  const addValue = (raw: string): void => {
    const value = raw.trim()
    if (value === "" || group.values.includes(value)) {
      setPending("")
      return
    }
    onChangeValues([...group.values, value])
    setPending("")
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      addValue(pending)
    }
  }

  return (
    <div className="rounded-md border border-border-subtle p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-content-secondary">{group.label}</h3>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-content-tertiary transition-colors duration-150 hover:text-feedback-danger-content"
        >
          Remove
        </button>
      </div>

      {group.kind === "scalar" ? (
        <Input
          value={group.values[0] ?? ""}
          onChange={(event) => onChangeValues([event.target.value])}
          aria-label={group.label}
        />
      ) : (
        <div className="space-y-2">
          {group.values.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {group.values.map((value) => (
                <li key={value}>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full bg-surface-subtle py-0.5 pl-2.5 pr-1",
                      "text-xs font-medium text-content-secondary ring-1 ring-inset ring-border-default",
                    )}
                  >
                    {value}
                    <button
                      type="button"
                      aria-label={`Remove ${value}`}
                      onClick={() => onChangeValues(group.values.filter((entry) => entry !== value))}
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
          <Input
            value={pending}
            onChange={(event) => setPending(event.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => addValue(pending)}
            placeholder={`Add to ${group.label.toLowerCase()} and press Enter`}
            aria-label={`Add ${group.label}`}
          />
        </div>
      )}
    </div>
  )
}
