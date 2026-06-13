import { useState } from "react"

import { createPlatformInvite } from "@/lib/platformInvitesApi"

type InviteMerchantModalProps = {
  getToken: () => Promise<string | null>
  isOpen: boolean
  onClose: () => void
  onSent: () => void
}

export function InviteMerchantModal({
  getToken,
  isOpen,
  onClose,
  onSent,
}: InviteMerchantModalProps): React.ReactElement | null {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) {
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    const trimmedEmail = email.trim()
    if (trimmedEmail.length === 0) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await createPlatformInvite({ email: trimmedEmail }, getToken)
      setEmail("")
      onSent()
      onClose()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to send invite",
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
        className="w-full max-w-md rounded-lg border border-border-subtle bg-surface-raised p-5 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-merchant-title"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <h3
          id="invite-merchant-title"
          className="text-base font-semibold text-content-primary"
        >
          Invite merchant
        </h3>
        <p className="mt-1 text-sm text-content-secondary">
          Send a single-use invite link that expires in 72 hours.
        </p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-content-primary">Merchant email</span>
            <input
              type="email"
              className="rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
              }}
              required
              autoFocus
            />
          </label>

          {error !== null ? (
            <p className="text-sm text-feedback-danger-content">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-border-subtle px-4 py-2 text-sm font-medium text-content-primary hover:bg-surface-subtle"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse transition-opacity hover:bg-interactive-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting || email.trim().length === 0}
            >
              {isSubmitting ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
