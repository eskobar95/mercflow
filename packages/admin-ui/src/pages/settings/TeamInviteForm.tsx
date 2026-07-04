import type { Dispatch, FormEvent, ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Spinner } from "@/components/ui/Spinner"
import type { TeamMemberRole } from "@/features/team/types"

import type { TeamSettingsAction } from "./useTeamSettingsPage"

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
] satisfies Array<{ value: TeamMemberRole; label: string }>

type TeamInviteFormProps = {
  email: string
  role: TeamMemberRole
  submitting: boolean
  error: string | null
  dispatch: Dispatch<TeamSettingsAction>
  onSubmit: () => void
}

export function TeamInviteForm({
  email,
  role,
  submitting,
  error,
  dispatch,
  onSubmit,
}: TeamInviteFormProps): ReactNode {
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-content-primary">Invite member</h2>
      <p className="mt-1 text-sm text-content-secondary">
        Send an email invitation with the role they should have in your store admin.
      </p>

      <form className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end" onSubmit={handleSubmit}>
        <FormField label="Email" htmlFor="team-invite-email" error={error ?? undefined} required>
          <Input
            id="team-invite-email"
            type="email"
            autoComplete="email"
            placeholder="colleague@example.com"
            value={email}
            disabled={submitting}
            error={error !== null}
            onChange={(event) => {
              dispatch({ type: "setInviteEmail", email: event.target.value })
            }}
          />
        </FormField>

        <FormField label="Role" htmlFor="team-invite-role" required>
          <Select
            id="team-invite-role"
            value={role}
            options={ROLE_OPTIONS}
            disabled={submitting}
            onValueChange={(value) => {
              if (value === "admin" || value === "staff") {
                dispatch({ type: "setInviteRole", role: value })
              }
            }}
          />
        </FormField>

        <Button type="submit" disabled={submitting} className="sm:mb-0">
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" label="Sending invitation" />
              Sending…
            </span>
          ) : (
            "Send invitation"
          )}
        </Button>
      </form>
    </Card>
  )
}
