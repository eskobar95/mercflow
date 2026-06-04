import type { JSX } from "react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/ui/PageHeader"

export function InventoryOverviewPage(): JSX.Element {
  return (
    <div className="p-6">
      <PageHeader title="Inventory" description="Suppliers, purchase orders, and stock operations." />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/inventory/purchase-orders"
          className="rounded-lg border border-border-default bg-surface-raised p-5 transition-colors hover:bg-surface-subtle"
        >
          <h2 className="text-lg font-semibold text-content-primary">Purchase orders</h2>
          <p className="mt-2 text-sm text-content-secondary">
            Create drafts, mark as ordered, and track incoming stock (receipt flow in a later sprint).
          </p>
        </Link>
        <Link
          to="/inventory/suppliers"
          className="rounded-lg border border-border-default bg-surface-raised p-5 transition-colors hover:bg-surface-subtle"
        >
          <h2 className="text-lg font-semibold text-content-primary">Suppliers</h2>
          <p className="mt-2 text-sm text-content-secondary">
            Maintain supplier contacts used when creating purchase orders.
          </p>
        </Link>
      </div>
    </div>
  )
}
