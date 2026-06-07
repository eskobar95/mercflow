import { type ReactNode, useId } from "react"

import { Select } from "@/components/ui/Select"
import type { AdminLocale } from "@/features/content-locale"

export type ContentLocaleSwitcherProps = {
  locales: AdminLocale[]
  value: string
  onChange: (code: string) => void
  disabled?: boolean
  /** While the locale list request is in flight */
  localesLoading?: boolean
  /** Resolved content row includes the locale code returned by the content API (may differ from switcher during failed loads). */
  resolvedContentLocale?: string | null
}

/**
 * Accessible locale control for MercFlow content editing (admin context only).
 */
export function ContentLocaleSwitcher({
  locales,
  value,
  onChange,
  disabled = false,
  localesLoading = false,
  resolvedContentLocale = null,
}: ContentLocaleSwitcherProps): ReactNode {
  const baseId = useId()
  const labelId = `${baseId}-label`
  const hintId = `${baseId}-hint`
  const statusId = `${baseId}-status`
  const selectId = `${baseId}-select`

  const active = locales.find((l) => l.code === value)
  const listReady = !localesLoading
  const emptyList = listReady && locales.length === 0
  const selectDisabled = disabled || localesLoading || emptyList

  const localeMismatch =
    resolvedContentLocale !== null &&
    resolvedContentLocale !== value &&
    !localesLoading &&
    !disabled

  const describedByParts: string[] = [hintId]
  if (localesLoading || emptyList) {
    describedByParts.push(statusId)
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-border-default bg-surface-default p-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1 space-y-1">
        <p id={labelId} className="text-sm font-medium text-content-primary">
          Editing language
        </p>
        <p id={hintId} className="text-xs text-content-tertiary">
          Content loads and saves with locale code{" "}
          <span className="font-mono text-xs font-medium text-content-primary">{value}</span>
          {active ? (
            <>
              {" "}
              (<span className="font-medium text-content-primary">{active.name}</span>)
            </>
          ) : null}
          . This does not change your store region or storefront language.
        </p>
        {localesLoading ? (
          <p id={statusId} className="text-xs text-content-secondary" role="status">
            Loading available languages…
          </p>
        ) : null}
        {emptyList ? (
          <p id={statusId} className="text-xs text-content-secondary" role="status">
            No store languages were returned. Add locales in Medusa Admin, then refresh this page.
          </p>
        ) : null}
        {localeMismatch ? (
          <p className="text-xs font-medium text-content-danger" role="alert">
            Loaded content is tagged as{" "}
            <span className="font-mono">{resolvedContentLocale}</span> but the switcher is set to{" "}
            <span className="font-mono">{value}</span>. Try again or reload.
          </p>
        ) : null}
      </div>
      <div className="shrink-0 sm:min-w-[14rem]">
        <Select
          id={selectId}
          value={value}
          disabled={selectDisabled}
          aria-labelledby={labelId}
          aria-describedby={describedByParts.join(" ")}
          options={locales.map((locale) => ({
            value: locale.code,
            label: `${locale.name} (${locale.code})`,
          }))}
          onValueChange={onChange}
        />
      </div>
    </div>
  )
}
