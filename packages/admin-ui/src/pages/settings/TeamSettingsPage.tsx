import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"

import { settingsTeamBreadcrumbs } from "@/config/settingsBreadcrumbs"

import { TeamChangeRoleDialog } from "./TeamChangeRoleDialog"
import { TeamInviteForm } from "./TeamInviteForm"
import { TeamMembersTable } from "./TeamMembersTable"
import { TeamRevokeMemberDialog } from "./TeamRevokeMemberDialog"
import { useTeamSettingsPage } from "./useTeamSettingsPage"

export function TeamSettingsPage(): ReactNode {
  const {
    hasBackend,
    state,
    dispatch,
    reload,
    showEmptyState,
    currentUserId,
    handleInvite,
    handleConfirmRevoke,
    handleConfirmRoleChange,
  } = useTeamSettingsPage()

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Configure{" "}
          <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to
          manage team settings.
        </p>
      </div>
    )
  }

  if (state.phase === "loading" || state.phase === "idle") {
    return (
      <div className="min-h-[50vh] bg-surface-appCanvas">
        <PageHeader title="Team" breadcrumbs={settingsTeamBreadcrumbs()} />
        <div className="p-6" aria-busy aria-live="polite">
          <Card className="p-6">
            <div className="h-24 animate-pulse rounded-md bg-surface-subtle" />
          </Card>
          <TeamMembersTable
            members={[]}
            isLoading
            showEmptyState={false}
            currentUserId={currentUserId}
            dispatch={dispatch}
          />
        </div>
      </div>
    )
  }

  if (state.phase === "error") {
    return (
      <div className="min-h-[50vh] bg-surface-appCanvas">
        <PageHeader title="Team" breadcrumbs={settingsTeamBreadcrumbs()} />
        <div className="p-6" role="alert">
          <Card className="p-6">
            <p className="font-medium text-content-primary">Could not load team members.</p>
            <p className="mt-2 text-sm text-content-secondary">{state.errorMessage}</p>
            <Button type="button" variant="secondary" className="mt-6" onClick={() => void reload()}>
              Try again
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[50vh] bg-surface-appCanvas">
      <PageHeader
        title="Team"
        description="Invite teammates and manage admin access without opening the Clerk dashboard."
        breadcrumbs={settingsTeamBreadcrumbs()}
      />

      <div className="p-6">
        <TeamInviteForm
          email={state.inviteEmail}
          role={state.inviteRole}
          submitting={state.inviteSubmitting}
          error={state.inviteError}
          dispatch={dispatch}
          onSubmit={() => {
            void handleInvite()
          }}
        />

        <TeamMembersTable
          members={state.members}
          isLoading={false}
          showEmptyState={showEmptyState}
          currentUserId={currentUserId}
          dispatch={dispatch}
        />
      </div>

      <TeamRevokeMemberDialog
        member={state.revokeTarget}
        submitting={state.revokeSubmitting}
        dispatch={dispatch}
        onConfirm={() => {
          void handleConfirmRevoke()
        }}
      />

      <TeamChangeRoleDialog
        member={state.roleTarget}
        roleSelection={state.roleSelection}
        submitting={state.roleSubmitting}
        dispatch={dispatch}
        onConfirm={() => {
          void handleConfirmRoleChange()
        }}
      />
    </div>
  )
}
