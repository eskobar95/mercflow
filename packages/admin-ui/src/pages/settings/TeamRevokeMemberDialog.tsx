import type { Dispatch, ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogDestructiveAction,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog"
import type { TeamMemberDto } from "@/features/team/types"

import type { TeamSettingsAction } from "./useTeamSettingsPage"

type TeamRevokeMemberDialogProps = {
  member: TeamMemberDto | null
  submitting: boolean
  dispatch: Dispatch<TeamSettingsAction>
  onConfirm: () => void
}

export function TeamRevokeMemberDialog({
  member,
  submitting,
  dispatch,
  onConfirm,
}: TeamRevokeMemberDialogProps): ReactNode {
  return (
    <AlertDialog
      open={member !== null}
      onOpenChange={(open) => {
        if (!open) {
          dispatch({ type: "closeRevoke" })
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke access?</AlertDialogTitle>
          <AlertDialogDescription>
            {member?.name ?? "This member"} will lose access to your store admin immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={submitting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogDestructiveAction
            type="button"
            disabled={submitting}
            onClick={onConfirm}
          >
            Revoke access
          </AlertDialogDestructiveAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
