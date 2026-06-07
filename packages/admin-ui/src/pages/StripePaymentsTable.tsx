import type { ReactNode } from "react"

import { Card } from "@/components/ui/Card"
import type { StripePaymentOverviewDto } from "@/features/connectors/stripeConnectorApi"

import { formatPaymentDate, formatStripeAmount } from "./stripeConnectorFormatters"

type StripePaymentsTableProps = {
  payments: StripePaymentOverviewDto[]
}

export function StripePaymentsTable({ payments }: StripePaymentsTableProps): ReactNode {
  return (
    <Card className="p-6 lg:p-8">
      <h2 className="text-lg font-semibold text-content-primary">Recent Stripe payments</h2>
      <p className="mt-2 text-sm text-content-secondary">
        Mirrors the Stripe PaymentIntent list endpoint (latest {payments.length === 20 ? "20" : String(payments.length)}{" "}
        rows visible here).
      </p>

      {payments.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-sm text-content-secondary">No payment intents fetched yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-auto rounded-lg border border-border-default">
          <table className="min-w-full text-left text-sm text-content-secondary">
            <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-content-tertiary">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Customer
                </th>
                <th scope="col" className="px-4 py-3">
                  Stripe id
                </th>
                <th scope="col" className="px-4 py-3">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-t border-border-subtle odd:bg-surface-default even:bg-surface-subtle"
                >
                  <td className="px-4 py-3 font-medium text-content-primary">
                    {formatStripeAmount(payment.amountMinor, payment.currency)}
                  </td>
                  <td className="px-4 py-3">{payment.status.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3">{payment.customerLabel ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{payment.id}</td>
                  <td className="px-4 py-3">{formatPaymentDate(payment.createdEpoch)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
