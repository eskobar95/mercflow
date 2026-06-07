import type { ReactNode } from "react"

type ListDateRangeControlProps = {
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  fromLabel?: string
  toLabel?: string
}

/** Compact created-date range inputs for list TopBar toolbars. */
export function ListDateRangeControl({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  fromLabel = "From",
  toLabel = "To",
}: ListDateRangeControlProps): ReactNode {
  return (
    <>
      <label className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border-default bg-surface-appCard px-2 text-xs text-content-secondary">
        <span className="sr-only">{fromLabel}</span>
        <span aria-hidden className="font-medium">
          {fromLabel}
        </span>
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => onDateFromChange(event.target.value)}
          aria-label={fromLabel}
          className="min-w-0 border-0 bg-transparent p-0 text-xs text-content-primary focus:outline-none"
        />
      </label>
      <label className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border-default bg-surface-appCard px-2 text-xs text-content-secondary">
        <span className="sr-only">{toLabel}</span>
        <span aria-hidden className="font-medium">
          {toLabel}
        </span>
        <input
          type="date"
          value={dateTo}
          onChange={(event) => onDateToChange(event.target.value)}
          aria-label={toLabel}
          className="min-w-0 border-0 bg-transparent p-0 text-xs text-content-primary focus:outline-none"
        />
      </label>
    </>
  )
}
