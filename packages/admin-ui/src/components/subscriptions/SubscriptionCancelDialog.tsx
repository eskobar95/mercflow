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

type SubscriptionCancelDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  productLabel: string | null
  isSubmitting: boolean
  onConfirm: () => void
}

export function SubscriptionCancelDialog({
  open,
  onOpenChange,
  productLabel,
  isSubmitting,
  onConfirm,
}: SubscriptionCancelDialogProps): ReactNode {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
          <AlertDialogDescription>
            {productLabel ?? "This subscription"} will be cancelled permanently. This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={isSubmitting}>
            Keep subscription
          </AlertDialogCancel>
          <AlertDialogDestructiveAction
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            Cancel subscription
          </AlertDialogDestructiveAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
