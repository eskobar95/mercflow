import type { PlatformInviteStatus } from "@/lib/platformInvitesApi"

type InviteStatusBadgeProps = {
  status: PlatformInviteStatus
}

function inviteStatusLabel(status: PlatformInviteStatus): string {
  switch (status) {
    case "pending":
      return "Pending"
    case "redeemed":
      return "Redeemed"
    case "expired":
      return "Expired"
    case "revoked":
      return "Revoked"
    default: {
      const exhaustive: never = status
      return exhaustive
    }
  }
}

function inviteStatusClass(status: PlatformInviteStatus): string {
  switch (status) {
    case "pending":
      return "bg-feedback-warning-subtle text-feedback-warning-content"
    case "redeemed":
      return "bg-feedback-success-subtle text-feedback-success-content"
    case "expired":
      return "bg-surface-subtle text-content-secondary"
    case "revoked":
      return "bg-feedback-danger-subtle text-feedback-danger-content"
    default: {
      const exhaustive: never = status
      return exhaustive
    }
  }
}

export function InviteStatusBadge({
  status,
}: InviteStatusBadgeProps): React.ReactElement {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${inviteStatusClass(status)}`}
    >
      {inviteStatusLabel(status)}
    </span>
  )
}
