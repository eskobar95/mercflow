import type { ReactNode } from "react"
import { formatAdminCurrency } from "@/utils/formatAdminCurrency"

import type { OrderLineItemRow } from "@/features/orders/orderTypes"

const thumbBox =
  "h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border-subtle bg-surface-subtle"

export function OrderLineItemsTable(props: {
  items: OrderLineItemRow[]
  currencyCode: string
}): ReactNode {
  if (props.items.length === 0) {
    return (
      <div className="rounded-lg border border-border-default bg-surface-default px-4 py-6 text-sm text-content-secondary shadow-sm">
        No line items.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-default bg-surface-default shadow-sm">
      <table className="min-w-full border-collapse">
        <caption className="sr-only">Order line items</caption>
        <thead className="bg-surface-subtle">
          <tr className="border-b border-border-default">
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-content-tertiary"
            >
              Item
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-content-tertiary"
            >
              Variant
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-content-tertiary"
            >
              Qty
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-content-tertiary"
            >
              Unit price
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-content-tertiary"
            >
              Row total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {props.items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {item.thumbnailUrl !== null ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className={`${thumbBox} object-cover`}
                      width={48}
                      height={48}
                    />
                  ) : (
                    <span className={thumbBox} aria-hidden />
                  )}
                  <span className="text-sm font-medium text-content-primary">{item.title}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-content-secondary">{item.variantLabel}</td>
              <td className="px-4 py-3 text-right text-sm tabular-nums text-content-primary">
                {item.quantity}
              </td>
              <td className="px-4 py-3 text-right text-sm tabular-nums text-content-primary">
                {formatAdminCurrency(item.unitPriceMinor, props.currencyCode)}
              </td>
              <td className="px-4 py-3 text-right text-sm font-medium tabular-nums text-content-primary">
                {formatAdminCurrency(item.rowTotalMinor, props.currencyCode)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
