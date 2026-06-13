import { useAuth } from "@clerk/react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { TenantBillingPanel } from "@/components/tenants/TenantBillingPanel"
import { TenantStatusBadge } from "@/components/tenants/TenantTable"
import { usePlatformTenants } from "@/hooks/usePlatformTenants"
import {
  fetchPlatformTenantBilling,
  type PlatformTenantBilling,
} from "@/lib/platformTenantsApi"

type BillingLoadState =
  | { status: "loading" }
  | { status: "ok"; billing: PlatformTenantBilling | null }
  | { status: "error"; message: string }

export function TenantDetailPage(): React.ReactElement {
  const { storeId } = useParams<{ storeId: string }>()
  const { getToken } = useAuth()
  const { state: tenantsState, reload: reloadTenants } = usePlatformTenants(getToken)
  const [billingState, setBillingState] = useState<BillingLoadState>({
    status: "loading",
  })
  const [billingReloadToken, setBillingReloadToken] = useState(0)

  useEffect(() => {
    if (storeId === undefined || storeId.trim() === "") {
      setBillingState({ status: "error", message: "Missing tenant id" })
      return
    }

    const tenantId = storeId
    let cancelled = false

    async function loadBilling(): Promise<void> {
      setBillingState({ status: "loading" })

      try {
        const billing = await fetchPlatformTenantBilling(tenantId, getToken)
        if (!cancelled) {
          setBillingState({ status: "ok", billing })
        }
      } catch (error) {
        if (!cancelled) {
          setBillingState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to load tenant billing",
          })
        }
      }
    }

    void loadBilling()

    return () => {
      cancelled = true
    }
  }, [getToken, storeId, billingReloadToken])

  const tenant =
    tenantsState.status === "ok" && storeId !== undefined
      ? tenantsState.tenants.find((entry) => entry.id === storeId) ?? null
      : null

  function reloadBillingAndTenant(): void {
    reloadTenants()
    setBillingReloadToken((value) => value + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/tenants"
          className="text-sm font-medium text-accent-text hover:underline"
        >
          ← Back to tenants
        </Link>
      </div>

      {tenantsState.status === "loading" ? (
        <p className="text-sm text-content-secondary">Loading tenant…</p>
      ) : null}

      {tenantsState.status === "error" ? (
        <p className="text-sm text-feedback-danger-content">{tenantsState.message}</p>
      ) : null}

      {tenantsState.status === "ok" && tenant === null ? (
        <p className="text-sm text-feedback-danger-content">Tenant not found.</p>
      ) : null}

      {tenant !== null ? (
        <>
          <section className="rounded-lg border border-border-subtle bg-surface-raised p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-content-primary">
                  {tenant.name}
                </h2>
                <p className="mt-1 text-sm text-content-secondary">{tenant.id}</p>
              </div>
              <TenantStatusBadge isDisabled={tenant.is_disabled} />
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-content-secondary">Domain</dt>
                <dd className="font-medium text-content-primary">
                  {tenant.domain ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-content-secondary">Created</dt>
                <dd className="font-medium text-content-primary">
                  {new Date(tenant.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </section>

          <TenantBillingPanel
            tenant={tenant}
            billing={billingState.status === "ok" ? billingState.billing : null}
            billingStatus={
              billingState.status === "loading"
                ? "loading"
                : billingState.status === "error"
                  ? "error"
                  : "ok"
            }
            billingError={
              billingState.status === "error" ? billingState.message : null
            }
            getToken={getToken}
            onSuspended={reloadBillingAndTenant}
          />
        </>
      ) : null}
    </div>
  )
}
