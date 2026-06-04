import { Link } from "react-router-dom"

import { SubscriptionsTable } from "@/components/subscriptions"
import { ListToolbar } from "@/components/ui/list/ListToolbar"
import { useAdminSubscriptions } from "@/features/subscriptions"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

/**
 * Admin subscriptions overview (MER-43): read-only list with status, customer, renewal, and discounts.
 */
export function SubscriptionsListPage(): JSX.Element {
  const backendConfigured = resolveMedusaAdminBackendUrl() !== null
  const { data, loading, errorMessage, refresh } = useAdminSubscriptions(backendConfigured)

  return (
    <div className="p-6">
      <div className="overflow-hidden rounded-lg border border-border-default bg-surface-default shadow-sm">
        <ListToolbar
          title="Subscriptions"
          description="Review active and historical subscription rows per customer."
          end={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
                disabled={loading || !backendConfigured}
                onClick={() => {
                  void refresh()
                }}
              >
                Refresh
              </button>
              <Link
                to="/"
                className="inline-flex items-center rounded-md border border-border-transparent px-3 py-1.5 text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
              >
                Home
              </Link>
            </div>
          }
        />
        {!backendConfigured ? (
          <div className="border-t border-border-subtle px-6 py-6 text-sm text-content-secondary">
            Configure <code className="rounded-sm bg-surface-subtle px-1 py-0.5 font-mono text-xs">VITE_MEDUSA_ADMIN_BACKEND_URL</code>{" "}
            so this view can call the Medusa admin subscription APIs.
          </div>
        ) : null}
        {errorMessage !== null && backendConfigured ? (
          <div className="border-t border-border-subtle px-6 py-4 text-sm text-feedback-danger-content">
            {errorMessage}
          </div>
        ) : null}
        {backendConfigured && errorMessage === null ? (
          <SubscriptionsTable rows={data?.data ?? []} isLoading={loading} />
        ) : null}
      </div>
    </div>
  )
}
