import { useCallback, useId, useState } from "react"

export type MediaGalleryManagerProps = {
  value: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

export function MediaGalleryManager({
  value,
  onChange,
  disabled = false,
}: MediaGalleryManagerProps): JSX.Element {
  const baseId = useId()
  const [draftId, setDraftId] = useState("")

  const move = useCallback(
    (index: number, direction: -1 | 1): void => {
      const next = index + direction
      if (next < 0 || next >= value.length) {
        return
      }
      const copy = [...value]
      const tmp = copy[index]
      const swap = copy[next]
      if (tmp === undefined || swap === undefined) {
        return
      }
      copy[index] = swap
      copy[next] = tmp
      onChange(copy)
    },
    [onChange, value]
  )

  const removeAt = useCallback(
    (index: number): void => {
      onChange(value.filter((_, i) => i !== index))
    },
    [onChange, value]
  )

  const addDraft = useCallback((): void => {
    const id = draftId.trim()
    if (id === "") {
      return
    }
    onChange([...value, id])
    setDraftId("")
  }, [draftId, onChange, value])

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor={`${baseId}-new-id`}
          className="block text-sm font-medium text-content-primary"
        >
          Add media ID
        </label>
        <p id={`${baseId}-new-hint`} className="mt-0.5 text-xs text-content-tertiary">
          Enter a Medusa file / media id. Full upload wiring is not included in this shell.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          <input
            id={`${baseId}-new-id`}
            type="text"
            value={draftId}
            onChange={(e) => {
              setDraftId(e.target.value)
            }}
            disabled={disabled}
            placeholder="e.g. file_01…"
            aria-describedby={`${baseId}-new-hint`}
            className="min-w-[12rem] flex-1 rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addDraft()
              }
            }}
          />
          <button
            type="button"
            disabled={disabled || draftId.trim() === ""}
            onClick={addDraft}
            className="rounded-md bg-interactive-primary px-3 py-1.5 text-sm font-medium text-content-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-content-secondary">No media in gallery yet.</p>
      ) : (
        <ul className="space-y-2" aria-label="Media gallery order">
          {value.map((id, index) => (
            <li
              key={`${id}-${index}`}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border-subtle bg-surface-default px-2 py-2"
            >
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-content-primary">
                {id}
              </span>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => {
                    move(index, -1)
                  }}
                  className="rounded border border-border-default bg-surface-subtle px-2 py-1 text-xs text-content-primary hover:bg-surface-raised disabled:opacity-50"
                  aria-label={`Move media ${index + 1} up`}
                >
                  Up
                </button>
                <button
                  type="button"
                  disabled={disabled || index === value.length - 1}
                  onClick={() => {
                    move(index, 1)
                  }}
                  className="rounded border border-border-default bg-surface-subtle px-2 py-1 text-xs text-content-primary hover:bg-surface-raised disabled:opacity-50"
                  aria-label={`Move media ${index + 1} down`}
                >
                  Down
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    removeAt(index)
                  }}
                  className="rounded border border-border-default bg-surface-default px-2 py-1 text-xs font-medium text-content-danger hover:bg-interactive-danger-subtle disabled:opacity-50"
                  aria-label={`Remove media ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
