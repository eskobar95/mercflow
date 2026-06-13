import { Link } from "react-router-dom"

import type { PlatformTenant } from "@/lib/platformTenantsApi"

type TenantStatusBadgeProps = {
  isDisabled: boolean
}

export function TenantStatusBadge({
  isDisabled,
}: TenantStatusBadgeProps): React.ReactElement {
  if (isDisabled) {
    return (
      <span className="inline-flex rounded-full bg-feedback-danger-subtle px-2.5 py-0.5 text-xs font-medium text-feedback-danger-content">
        Suspended
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-full bg-feedback-success-subtle px-2.5 py-0.5 text-xs font-medium text-feedback-success-content">
      Active
    </span>
  )
}

type TenantTableProps = {
  tenants: PlatformTenant[]
}

function formatCreatedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

export function TenantTable({
  tenants,
}: TenantTableProps): React.ReactElement {
  if (tenants.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-6 text-sm text-content-secondary">
        No tenants found yet. Provision the first tenant using the form below.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised">
      <table className="min-w-full divide-y divide-border-subtle text-sm">
        <thead className="bg-surface-subtle text-left text-content-secondary">
          <tr>
            <th className="px-4 py-3 font-medium">Store</th>
            <th className="px-4 py-3 font-medium">Domain</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {tenants.map((tenant) => (
            <tr key={tenant.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-content-primary">{tenant.name}</div>
                <div className="text-xs text-content-secondary">{tenant.id}</div>
              </td>
              <td className="px-4 py-3 text-content-secondary">
                {tenant.domain ?? "—"}
              </td>
              <td className="px-4 py-3">
                <TenantStatusBadge isDisabled={tenant.is_disabled} />
              </td>
              <td className="px-4 py-3 text-content-secondary">
                {formatCreatedAt(tenant.created_at)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/tenants/${encodeURIComponent(tenant.id)}`}
                  className="rounded-md border border-border-subtle px-3 py-1.5 text-xs font-medium text-content-primary transition-colors hover:border-border-strong hover:bg-surface-subtle"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
