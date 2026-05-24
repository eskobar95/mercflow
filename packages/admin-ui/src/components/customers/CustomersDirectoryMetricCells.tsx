import type { CustomersDirectoryRow } from "@/features/customers/hooks/useCustomersDirectory"
import { formatMinorAmount } from "@/features/customers/formatMoney"
import {
  summarizeLifetimeDisplayText,
} from "@/features/customers/customersPaidSpend"

function MetricPlaceholder({ label }: { readonly label: string }): JSX.Element {
  return (
    <span
      aria-busy="true"
      aria-label={label}
      className="inline-block h-4 w-28 max-w-full animate-pulse rounded-sm bg-surface-subtle"
    />
  )
}

export function CustomersOrderCountCell({
  row,
}: {
  readonly row: CustomersDirectoryRow
}): JSX.Element {
  if (row.spend.status === "loading") {
    return <MetricPlaceholder label="Loading order count" />
  }
  if (row.spend.status === "error") {
    return <span className="text-xs text-content-tertiary">Unavailable</span>
  }
  return <span className="tabular-nums">{row.spend.summary.totalOrderCount}</span>
}

export function CustomersLifetimeValueCell({
  row,
}: {
  readonly row: CustomersDirectoryRow
}): JSX.Element {
  if (row.spend.status === "loading") {
    return <MetricPlaceholder label="Loading lifetime value" />
  }
  if (row.spend.status === "error") {
    return (
      <span className="text-xs text-feedback-danger-content" role="alert">
        {row.spend.message}
      </span>
    )
  }

  const view = summarizeLifetimeDisplayText(row.spend.summary)
  if (view.kind === "single") {
    return (
      <span className="font-semibold tabular-nums text-content-primary">
        {formatMinorAmount(view.minor, view.currency)}
      </span>
    )
  }
  if (view.kind === "mixed") {
    return <span className="text-sm text-content-secondary">Multiple currencies</span>
  }
  return (
    <span className="text-sm text-content-secondary">
      {formatMinorAmount(0n, "usd")}
    </span>
  )
}
