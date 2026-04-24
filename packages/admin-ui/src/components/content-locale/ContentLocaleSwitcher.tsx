import { useId } from "react"

import type { AdminLocale } from "@/features/content-locale"

export type ContentLocaleSwitcherProps = {
  locales: AdminLocale[]
  value: string
  onChange: (code: string) => void
  disabled?: boolean
}

/**
 * Accessible locale control for MercFlow content editing (admin context only).
 * Visual treatment uses design tokens / Tailwind theme aliases only.
 */
export function ContentLocaleSwitcher({
  locales,
  value,
  onChange,
  disabled = false,
}: ContentLocaleSwitcherProps): JSX.Element {
  const baseId = useId()
  const labelId = `${baseId}-label`
  const hintId = `${baseId}-hint`
  const selectId = `${baseId}-select`

  const active = locales.find((l) => l.code === value)
  const selectDisabled = disabled || locales.length === 0

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-subtle p-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1 space-y-1">
        <p id={labelId} className="text-sm font-medium text-content-secondary">
          Editing language
        </p>
        <p id={hintId} className="text-xs text-content-tertiary">
          Editing in{" "}
          <span className="font-medium text-content-primary">{active?.name ?? value}</span>
        </p>
      </div>
      <div className="shrink-0 sm:min-w-[12rem]">
        <label htmlFor={selectId} className="sr-only">
          Select editing language
        </label>
        <select
          id={selectId}
          className="h-10 w-full rounded-md border border-border-default bg-surface-default px-3 text-sm text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:cursor-not-allowed disabled:border-interactive-disabled-border disabled:bg-interactive-disabled-background disabled:text-interactive-disabled-text"
          value={value}
          disabled={selectDisabled}
          onChange={(event) => {
            onChange(event.target.value)
          }}
          aria-labelledby={labelId}
          aria-describedby={hintId}
        >
          {locales.map((locale) => (
            <option key={locale.code} value={locale.code}>
              {locale.name} ({locale.code})
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
