import { useState } from "react"

import type { PlatformTenant } from "@/lib/platformTenantsApi"
import { suspendPlatformTenant } from "@/lib/platformTenantsApi"

type SuspendTenantModalProps = {
  tenant: PlatformTenant | null
  getToken: () => Promise<string | null>
  onClose: () => void
  onSuspended: () => void
}

export function SuspendTenantModal({
  tenant,
  getToken,
  onClose,
  onSuspended,
}: SuspendTenantModalProps): React.ReactElement | null {
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (tenant === null) {
    return null
  }

  const activeTenant = tenant

  async function handleConfirm(): Promise<void> {
    if (reason.trim().length === 0) {
      setError("Reason is required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await suspendPlatformTenant(
        activeTenant.id,
        { reason: reason.trim() },
        getToken,
      )
      onSuspended()
      onClose()
      setReason("")
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to suspend tenant",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-modal-backdrop flex items-center justify-center bg-surface-overlay/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-border-subtle bg-surface-raised p-5 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="suspend-tenant-title"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <h3
          id="suspend-tenant-title"
          className="text-lg font-semibold text-content-primary"
        >
          Suspend tenant
        </h3>
        <p className="mt-2 text-sm text-content-secondary">
          This disables the store and revokes publishable API keys for{" "}
          <span className="font-medium text-content-primary">{activeTenant.name}</span>.
          Store Admin login remains available for support contact.
        </p>

        <label className="mt-4 grid gap-1 text-sm">
          <span className="font-medium text-content-primary">Reason</span>
          <textarea
            className="min-h-24 rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
            }}
            required
          />
        </label>

        {error !== null ? (
          <p className="mt-3 text-sm text-feedback-danger-content">{error}</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-border-subtle px-4 py-2 text-sm font-medium text-content-primary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-interactive-destructive px-4 py-2 text-sm font-medium text-content-inverse hover:bg-interactive-destructive-hover disabled:opacity-50"
            onClick={() => {
              void handleConfirm()
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Suspending…" : "Confirm suspend"}
          </button>
        </div>
      </div>
    </div>
  )
}
