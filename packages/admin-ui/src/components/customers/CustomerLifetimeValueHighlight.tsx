import { Card } from "@/components/ui/Card"
import type { CustomerPaidSpendSummary } from "@/features/customers/customersAdminTypes"
import { formatMinorAmount } from "@/features/customers/formatMoney"
import {
  summarizeLifetimeDisplayText,
} from "@/features/customers/customersPaidSpend"

type CustomerLifetimeValueHighlightProps = {
  readonly summary: CustomerPaidSpendSummary | null
  /** Store default ISO currency — used when paid lifetime sum is zero. */
  readonly storeCurrencyCode: string
  readonly isLoading?: boolean
}

export function CustomerLifetimeValueHighlight({
  summary,
  storeCurrencyCode,
  isLoading = false,
}: CustomerLifetimeValueHighlightProps): JSX.Element {
  if (isLoading || summary === null) {
    return (
      <Card className="border-dashed bg-surface-raised">
        <p className="text-sm font-medium text-content-secondary">Lifetime value</p>
        <div
          className="mt-4 h-10 w-3/5 max-w-xs animate-pulse rounded-md bg-surface-subtle"
          aria-busy="true"
          aria-label="Calculating lifetime value"
        />
        <p className="mt-2 text-xs text-content-tertiary">Summing captured Medusa payments</p>
      </Card>
    )
  }

  const view = summarizeLifetimeDisplayText(summary)

  let amountLabel: string
  if (view.kind === "single") {
    amountLabel = formatMinorAmount(view.minor, view.currency)
  } else if (view.kind === "mixed") {
    amountLabel = "Multiple currencies"
  } else {
    amountLabel = formatMinorAmount(0n, storeCurrencyCode.trim().toLowerCase())
  }

  return (
    <Card elevation="hover" className="border-2 border-border-focus bg-surface-raised shadow-md">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
          Lifetime value
        </p>
        <p className="text-4xl font-semibold text-content-primary">{amountLabel}</p>
        <p className="text-sm text-content-secondary">
          Orders recorded:&nbsp;
          <span className="font-semibold text-content-primary">{summary.totalOrderCount}</span>
        </p>
        <p className="text-sm text-content-secondary">
          Paid orders in lifetime:&nbsp;
          <span className="font-semibold text-content-primary">{summary.paidOrderCount}</span>
        </p>
        {view.kind === "mixed" ? (
          <p className="text-xs text-content-tertiary">
            Paid revenue spans more than one currency — review orders for currency-specific totals.
          </p>
        ) : (
          <p className="text-xs text-content-tertiary">
            Includes totals from orders captured, completed, or partially captured (Medusa Admin).
          </p>
        )}
      </div>
    </Card>
  )
}
