import type { Dispatch, ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog"
import { FormField } from "@/components/ui/FormField"
import { Select } from "@/components/ui/Select"
import { Spinner } from "@/components/ui/Spinner"
import type { TeamMemberDto, TeamMemberRole } from "@/features/team/types"

import type { TeamSettingsAction } from "./useTeamSettingsPage"

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
] satisfies Array<{ value: TeamMemberRole; label: string }>

type TeamChangeRoleDialogProps = {
  member: TeamMemberDto | null
  roleSelection: TeamMemberRole
  submitting: boolean
  dispatch: Dispatch<TeamSettingsAction>
  onConfirm: () => void
}

export function TeamChangeRoleDialog({
  member,
  roleSelection,
  submitting,
  dispatch,
  onConfirm,
}: TeamChangeRoleDialogProps): ReactNode {
  return (
    <AlertDialog
      open={member !== null}
      onOpenChange={(open) => {
        if (!open) {
          dispatch({ type: "closeRoleDialog" })
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change role</AlertDialogTitle>
          <AlertDialogDescription>
            Choose the access level for {member?.name ?? "this member"}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="px-4 py-4">
          <FormField label="Role" htmlFor="team-change-role" required>
            <Select
              id="team-change-role"
              value={roleSelection}
              options={ROLE_OPTIONS}
              disabled={submitting}
              onValueChange={(value) => {
                if (value === "admin" || value === "staff") {
                  dispatch({ type: "setRoleSelection", role: value })
                }
              }}
            />
          </FormField>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={submitting}>
            Cancel
          </AlertDialogCancel>
          <Button type="button" disabled={submitting} onClick={onConfirm}>
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" label="Saving role" />
                Saving…
              </span>
            ) : (
              "Save role"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
