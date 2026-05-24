import { Card } from "@/components/ui/Card"

import type { OrderDetail } from "@/features/orders/orderTypes"

function formatPersonName(customer: NonNullable<OrderDetail["customer"]>): string {
  const parts = [customer.firstName, customer.lastName].filter(
    (p): p is string => typeof p === "string" && p.trim() !== ""
  )
  return parts.join(" ").trim() || "—"
}

export function OrderCustomerCard(props: { detail: OrderDetail }): JSX.Element {
  const c = props.detail.customer
  const custEmail =
    c !== null && typeof c.email === "string" && c.email.trim() !== "" ? c.email : null
  const primaryEmail =
    custEmail ??
    (props.detail.email.trim() !== "" ? props.detail.email : "—")

  return (
    <Card>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
        Customer
      </h2>
      {c === null ? (
        <p className="mt-2 text-sm text-content-secondary">
          Guest checkout:{" "}
          <span className="text-content-primary">{primaryEmail}</span>
        </p>
      ) : (
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-content-tertiary">Name</dt>
            <dd className="text-content-primary">{formatPersonName(c)}</dd>
          </div>
          <div>
            <dt className="text-content-tertiary">Email</dt>
            <dd className="break-all text-content-primary">{primaryEmail}</dd>
          </div>
          {c.id !== null ? (
            <div>
              <dt className="text-content-tertiary">Customer ID</dt>
              <dd>
                <code className="text-xs text-content-secondary">{c.id}</code>
              </dd>
            </div>
          ) : null}
        </dl>
      )}
    </Card>
  )
}
