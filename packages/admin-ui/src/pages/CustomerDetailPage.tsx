import { Link, useParams } from "react-router-dom"

import { CustomerLifetimeValueHighlight } from "@/components/customers/CustomerLifetimeValueHighlight"
import { CustomerOrdersTable } from "@/components/customers/CustomerOrdersTable"
import { CustomerProfileCard } from "@/components/customers/CustomerProfileCard"
import { Card } from "@/components/ui/Card"
import { customerDisplayName } from "@/features/customers/customerFormatting"
import { useCustomerWorkspace } from "@/features/customers/hooks/useCustomerWorkspace"

export function CustomerDetailPage(): JSX.Element {
  const { customerId } = useParams<{ customerId: string }>()
  const {
    phase,
    errorMessage,
    customer,
    recentOrders,
    spendSummary,
    lifetimeValueDisplayCurrency,
    requestReload,
  } = useCustomerWorkspace(customerId)

  if (!customerId) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Missing customer identifier — return to{" "}
          <Link className="text-interactive-primary hover:text-interactive-primary-hover" to="/customers">
            Customers
          </Link>
          .
        </p>
      </div>
    )
  }

  if (!errorMessage && (phase === "idle" || phase === "loading")) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-5 w-32 animate-pulse rounded-sm bg-surface-subtle" aria-hidden />
        <div className="grid gap-4 lg:grid-cols-[2fr,minmax(0,1fr)]">
          <div className="h-40 animate-pulse rounded-lg bg-surface-subtle" aria-hidden />
          <div className="h-40 animate-pulse rounded-lg bg-surface-subtle" aria-hidden />
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-surface-subtle" aria-hidden />
        <p className="text-sm text-content-tertiary">Loading profile, orders, and lifetime totals…</p>
      </div>
    )
  }

  if (phase === "error" || customer === null) {
    const showRetry =
      typeof errorMessage === "string" &&
      errorMessage !== "Missing backend URL. Configure VITE_MEDUSA_ADMIN_BACKEND_URL to load customer data."

    return (
      <div className="space-y-4 p-6">
        <Card className="border-feedback-danger-border bg-feedback-danger-subtle">
          <h1 className="text-lg font-semibold text-feedback-danger-content">Unable to load customer</h1>
          <p className="mt-2 text-sm text-feedback-danger-content">{errorMessage}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {showRetry ? (
              <button
                type="button"
                className="rounded-md border border-feedback-danger px-4 py-2 text-sm font-medium text-feedback-danger-content"
                onClick={requestReload}
              >
                Try again
              </button>
            ) : null}
            <Link
              to="/customers"
              className="rounded-md border border-border-default bg-surface-default px-4 py-2 text-sm font-medium text-content-primary shadow-sm"
            >
              ← Customers
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          to="/customers"
          className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
        >
          ← Customers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-content-primary">
          {customerDisplayName(customer)}
        </h1>
        <p className="text-sm text-content-tertiary">Customer #{customer.id}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,minmax(0,1fr)]">
        <CustomerProfileCard customer={customer} />
        <CustomerLifetimeValueHighlight
          summary={spendSummary}
          storeCurrencyCode={lifetimeValueDisplayCurrency}
        />
      </div>

      <section aria-labelledby="customer-orders-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="customer-orders-heading" className="text-lg font-semibold text-content-primary">
              Recent orders
            </h2>
            <p className="text-sm text-content-tertiary">
              Showing the newest {recentOrders.length} orders returned by Medusa Admin (up to ten
              requested).
            </p>
          </div>
          <button
            type="button"
            className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-content-secondary shadow-sm"
            onClick={requestReload}
          >
            Refresh
          </button>
        </div>
        <CustomerOrdersTable orders={recentOrders} caption="Ten most recent orders for this customer" />
      </section>
    </div>
  )
}
