import type { AdminOrderLite } from "@/features/customers/customersAdminTypes"
import { formatMinorAmount } from "@/features/customers/formatMoney"
import { parseOrderMinorTotal } from "@/features/customers/customersPaidSpend"

type CustomerOrdersTableProps = {
  readonly orders: readonly AdminOrderLite[]
  readonly caption?: string
}

function formatOrderRelativeTime(value: string | undefined): string {
  if (!value) {
    return "—"
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function CustomerOrdersTable({
  orders,
  caption = "Last ten orders fetched from Medusa Admin",
}: CustomerOrdersTableProps): JSX.Element {
  return (
    <div className="overflow-hidden rounded-lg border border-border-default bg-surface-default shadow-sm">
      <table className="min-w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-subtle">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-content-secondary">
            <th scope="col" className="px-4 py-3 font-medium">
              Date
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Fulfillment status
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Payment status
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td
                className="px-4 py-10 text-center text-sm text-content-secondary"
                colSpan={4}
              >
                No orders returned for this customer yet.
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const fulfillment = order.status?.trim() === "" ? "—" : order.status ?? "—"
              const payment = order.payment_status?.trim() === "" ? "—" : order.payment_status ?? "—"
              const amount = parseOrderMinorTotal(order)
              return (
                <tr key={order.id} className="border-t border-border-subtle text-sm">
                  <td className="px-4 py-3 text-content-primary">{formatOrderRelativeTime(order.created_at)}</td>
                  <td className="px-4 py-3 capitalize text-content-primary">{fulfillment}</td>
                  <td className="px-4 py-3 text-content-secondary">
                    <span className="inline-flex items-center rounded-md border border-border-subtle px-2 py-0.5 text-xs capitalize text-content-primary">
                      {payment.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums text-content-primary">
                    {formatMinorAmount(amount, order.currency_code)}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
