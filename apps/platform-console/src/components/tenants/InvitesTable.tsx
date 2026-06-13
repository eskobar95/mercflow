import type { PlatformInvite } from "@/lib/platformInvitesApi"
import { InviteStatusBadge } from "@/components/tenants/InviteStatusBadge"

function formatTimestamp(value: string | null): string {
  if (value === null) {
    return "—"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

type InvitesTableProps = {
  invites: PlatformInvite[]
  onRevoke: (invite: PlatformInvite) => void
  revokingInviteId: string | null
}

export function InvitesTable({
  invites,
  onRevoke,
  revokingInviteId,
}: InvitesTableProps): React.ReactElement {
  if (invites.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-6 text-sm text-content-secondary">
        No invites yet. Send the first merchant invite using the button above.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised">
      <table className="min-w-full divide-y divide-border-subtle text-sm">
        <thead className="bg-surface-subtle text-left text-content-secondary">
          <tr>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Expires</th>
            <th className="px-4 py-3 font-medium">Redeemed</th>
            <th className="px-4 py-3 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {invites.map((invite) => (
            <tr key={invite.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-content-primary">{invite.email}</div>
                <div className="text-xs text-content-secondary">{invite.id}</div>
              </td>
              <td className="px-4 py-3">
                <InviteStatusBadge status={invite.status} />
              </td>
              <td className="px-4 py-3 text-content-secondary">
                {formatTimestamp(invite.expires_at)}
              </td>
              <td className="px-4 py-3 text-content-secondary">
                {formatTimestamp(invite.redeemed_at)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  className="rounded-md border border-border-subtle px-3 py-1.5 text-xs font-medium text-content-primary transition-colors hover:border-border-strong hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={invite.status !== "pending" || revokingInviteId === invite.id}
                  onClick={() => {
                    onRevoke(invite)
                  }}
                >
                  {revokingInviteId === invite.id ? "Revoking…" : "Revoke"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
