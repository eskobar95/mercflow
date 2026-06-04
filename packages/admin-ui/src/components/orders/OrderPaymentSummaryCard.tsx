import { Card } from "@/components/ui/Card"

import { formatAdminCurrency } from "@/utils/formatAdminCurrency"

export function OrderPaymentSummaryCard(props: {
  currencyCode: string
  paymentStatus: string
  totalMinor: number
}): JSX.Element {
  return (
    <Card>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
        Payment summary
      </h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-content-tertiary">Payment status</dt>
          <dd className="font-medium capitalize text-content-primary">
            {props.paymentStatus.replaceAll("_", " ")}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-content-tertiary">Currency</dt>
          <dd className="font-medium uppercase text-content-primary">{props.currencyCode}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border-subtle pt-2">
          <dt className="text-content-secondary">Order total</dt>
          <dd className="text-base font-semibold text-content-primary">
            {formatAdminCurrency(props.totalMinor, props.currencyCode)}
          </dd>
        </div>
      </dl>
    </Card>
  )
}
