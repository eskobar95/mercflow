import { useRef, useState } from "react"

import { cn } from "@/lib/cn"

function SearchIcon(): JSX.Element {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

type SearchToggleProps = {
  value: string
  onChange: (v: string) => void
  onClear: () => void
}

export function SearchToggle({ value, onChange, onClear }: SearchToggleProps): JSX.Element {
  const [expanded, setExpanded] = useState(Boolean(value))
  const inputRef = useRef<HTMLInputElement>(null)

  function expand(): void {
    setExpanded(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function collapse(): void {
    if (!value) setExpanded(false)
  }

  if (!expanded) {
    return (
      <button
        type="button"
        aria-label="Search products"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-content-tertiary transition-colors hover:bg-surface-subtle hover:text-content-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-strong"
        onClick={expand}
      >
        <SearchIcon />
      </button>
    )
  }

  return (
    <div className="relative flex shrink-0 items-center">
      <span className="absolute left-2.5 text-content-tertiary" aria-hidden>
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={collapse}
        placeholder="Search…"
        aria-label="Search products"
        className={cn(
          "h-7 w-44 rounded border border-border-default bg-surface-default pl-7 pr-6",
          "text-xs text-content-primary placeholder:text-content-tertiary",
          "focus-visible:border-accent focus-visible:outline-none",
          "transition-[width,border-color] duration-150",
        )}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute right-2 text-content-tertiary hover:text-content-primary"
          onMouseDown={(e) => {
            e.preventDefault()
            onClear()
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path
              d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  )
}
