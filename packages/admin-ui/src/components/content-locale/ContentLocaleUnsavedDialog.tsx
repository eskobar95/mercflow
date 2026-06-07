import type { ReactNode } from "react"
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

export type ContentLocaleUnsavedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Busy while save, discard reload, or content fetch runs */
  actionDisabled: boolean
  onSave: () => void
  onDiscard: () => void
  /** Called when the dialog closes for any reason. */
  onClose: () => void
}

/**
 * Save-or-discard confirm before changing editing locale.
 */
export function ContentLocaleUnsavedDialog({
  open,
  onOpenChange,
  actionDisabled,
  onSave,
  onDiscard,
  onClose,
}: ContentLocaleUnsavedDialogProps): ReactNode {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          onClose()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save or discard before switching language?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved MercFlow content changes for this language. Save them, or discard to
            reload the last saved version — then you can switch.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={actionDisabled}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="secondary"
            disabled={actionDisabled}
            onClick={() => {
              onDiscard()
            }}
          >
            Discard and switch
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={actionDisabled}
            onClick={() => {
              onSave()
            }}
          >
            Save and switch
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
