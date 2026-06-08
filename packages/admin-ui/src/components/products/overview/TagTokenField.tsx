import { type KeyboardEvent, type ReactNode, useState } from "react"

import { cn } from "@/lib/cn"

type TagTokenFieldProps = {
  tags: string[]
  onChange: (tags: string[]) => void
}

/** Free-form tag editor — pills with remove, commit on Enter or comma. */
export function TagTokenField({ tags, onChange }: TagTokenFieldProps): ReactNode {
  const [pending, setPending] = useState("")

  const add = (raw: string): void => {
    const value = raw.trim()
    if (value === "" || tags.includes(value)) {
      setPending("")
      return
    }
    onChange([...tags, value])
    setPending("")
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      add(pending)
    } else if (event.key === "Backspace" && pending === "" && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="space-y-2">
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag}>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full bg-surface-subtle py-0.5 pl-2.5 pr-1",
                  "text-xs font-medium text-content-secondary ring-1 ring-inset ring-border-default",
                )}
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() => onChange(tags.filter((entry) => entry !== tag))}
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
      <input
        value={pending}
        onChange={(event) => setPending(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(pending)}
        placeholder="Add a tag and press Enter"
        aria-label="Add tag"
        className="h-9 w-full rounded-sm border border-border-default bg-surface-appCard px-3 text-sm text-content-primary outline-none transition-colors duration-150 placeholder:text-content-tertiary focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-border-focus"
      />
    </div>
  )
}
