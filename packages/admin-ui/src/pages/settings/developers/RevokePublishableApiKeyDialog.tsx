import type { ReactNode } from "react"

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

type RevokePublishableApiKeyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  onConfirm: () => void
}

export function RevokePublishableApiKeyDialog({
  open,
  onOpenChange,
  isSubmitting,
  onConfirm,
}: RevokePublishableApiKeyDialogProps): ReactNode {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke and regenerate publishable key?</AlertDialogTitle>
          <AlertDialogDescription>
            The current publishable API key will stop working immediately. Storefronts and
            integrations using it must be updated with the new key. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={isSubmitting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogDestructiveAction type="button" disabled={isSubmitting} onClick={onConfirm}>
            Revoke &amp; regenerate
          </AlertDialogDestructiveAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
