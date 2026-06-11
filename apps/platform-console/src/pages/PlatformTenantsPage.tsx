import { useAuth } from "@clerk/react"
import { useState } from "react"

import { ProvisionTenantForm } from "@/components/tenants/ProvisionTenantForm"
import { SuspendTenantModal } from "@/components/tenants/SuspendTenantModal"
import { TenantTable } from "@/components/tenants/TenantTable"
import { usePlatformTenants } from "@/hooks/usePlatformTenants"
import type { PlatformTenant } from "@/lib/platformTenantsApi"

export function PlatformTenantsPage(): React.ReactElement {
  const { getToken } = useAuth()
  const { state, reload } = usePlatformTenants(getToken)
  const [suspendTarget, setSuspendTarget] = useState<PlatformTenant | null>(null)

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-content-primary">Tenants</h2>
        <p className="mt-2 max-w-2xl text-sm text-content-secondary">
          List all MercFlow stores, provision new tenants, and suspend misbehaving shops.
          All write actions are recorded in the platform audit log.
        </p>
      </section>

      {state.status === "loading" ? (
        <p className="text-sm text-content-secondary">Loading tenants…</p>
      ) : null}

      {state.status === "error" ? (
        <p className="text-sm text-feedback-danger-content">{state.message}</p>
      ) : null}

      {state.status === "ok" ? (
        <TenantTable
          tenants={state.tenants}
          onSuspend={(tenant) => {
            setSuspendTarget(tenant)
          }}
        />
      ) : null}

      <ProvisionTenantForm
        getToken={getToken}
        onComplete={() => {
          reload()
        }}
      />

      <SuspendTenantModal
        tenant={suspendTarget}
        getToken={getToken}
        onClose={() => {
          setSuspendTarget(null)
        }}
        onSuspended={() => {
          reload()
        }}
      />
    </div>
  )
}
