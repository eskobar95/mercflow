import { useAuth } from "@clerk/react"
import { useState } from "react"

import { InviteMerchantModal } from "@/components/tenants/InviteMerchantModal"
import { InvitesTable } from "@/components/tenants/InvitesTable"
import { ProvisionTenantForm } from "@/components/tenants/ProvisionTenantForm"
import { TenantTable } from "@/components/tenants/TenantTable"
import { usePlatformInvites } from "@/hooks/usePlatformInvites"
import { usePlatformTenants } from "@/hooks/usePlatformTenants"
import type { PlatformInvite } from "@/lib/platformInvitesApi"
import { revokePlatformInvite } from "@/lib/platformInvitesApi"

type TenantsTab = "tenants" | "invites"

export function PlatformTenantsPage(): React.ReactElement {
  const { getToken } = useAuth()
  const { state: tenantsState, reload: reloadTenants } = usePlatformTenants(getToken)
  const { state: invitesState, reload: reloadInvites } = usePlatformInvites(getToken)
  const [activeTab, setActiveTab] = useState<TenantsTab>("tenants")
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null)
  const [revokeError, setRevokeError] = useState<string | null>(null)

  async function handleRevokeInvite(invite: PlatformInvite): Promise<void> {
    setRevokingInviteId(invite.id)
    setRevokeError(null)

    try {
      await revokePlatformInvite(invite.id, getToken)
      reloadInvites()
    } catch (error) {
      setRevokeError(
        error instanceof Error ? error.message : "Failed to revoke invite",
      )
    } finally {
      setRevokingInviteId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-content-primary">Tenants</h2>
          <p className="mt-2 max-w-2xl text-sm text-content-secondary">
            Invite merchants, monitor invite status, provision tenants, and suspend shops.
            All write actions are recorded in the platform audit log.
          </p>
        </div>

        <button
          type="button"
          className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse transition-opacity hover:bg-interactive-primary-hover"
          onClick={() => {
            setIsInviteModalOpen(true)
          }}
        >
          Invite merchant
        </button>
      </section>

      <div className="flex gap-2 border-b border-border-subtle">
        <button
          type="button"
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "tenants"
              ? "border-accent-text text-content-primary"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
          onClick={() => {
            setActiveTab("tenants")
          }}
        >
          Tenants
        </button>
        <button
          type="button"
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "invites"
              ? "border-accent-text text-content-primary"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
          onClick={() => {
            setActiveTab("invites")
          }}
        >
          Invites
        </button>
      </div>

      {activeTab === "tenants" ? (
        <>
          {tenantsState.status === "loading" ? (
            <p className="text-sm text-content-secondary">Loading tenants…</p>
          ) : null}

          {tenantsState.status === "error" ? (
            <p className="text-sm text-feedback-danger-content">{tenantsState.message}</p>
          ) : null}

          {tenantsState.status === "ok" ? (
            <TenantTable tenants={tenantsState.tenants} />
          ) : null}

          <ProvisionTenantForm
            getToken={getToken}
            onComplete={() => {
              reloadTenants()
            }}
          />
        </>
      ) : null}

      {activeTab === "invites" ? (
        <>
          {invitesState.status === "loading" ? (
            <p className="text-sm text-content-secondary">Loading invites…</p>
          ) : null}

          {invitesState.status === "error" ? (
            <p className="text-sm text-feedback-danger-content">{invitesState.message}</p>
          ) : null}

          {revokeError !== null ? (
            <p className="text-sm text-feedback-danger-content">{revokeError}</p>
          ) : null}

          {invitesState.status === "ok" ? (
            <InvitesTable
              invites={invitesState.invites}
              revokingInviteId={revokingInviteId}
              onRevoke={(invite) => {
                void handleRevokeInvite(invite)
              }}
            />
          ) : null}
        </>
      ) : null}

      <InviteMerchantModal
        getToken={getToken}
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false)
        }}
        onSent={() => {
          reloadInvites()
          setActiveTab("invites")
        }}
      />
    </div>
  )
}
