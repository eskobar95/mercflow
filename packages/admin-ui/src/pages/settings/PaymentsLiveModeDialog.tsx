import type { ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog"
import { Button } from "@/components/ui/Button"
import { Spinner } from "@/components/ui/Spinner"

import type { ModeSwitchState } from "./paymentsSettingsState"

type PaymentsLiveModeDialogProps = {
  open: boolean
  modeSwitchState: ModeSwitchState
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function PaymentsLiveModeDialog({
  open,
  modeSwitchState,
  onOpenChange,
  onConfirm,
}: PaymentsLiveModeDialogProps): ReactNode {
  const switching = modeSwitchState.status === "switching"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activate live mode?</AlertDialogTitle>
          <AlertDialogDescription>
            Live mode uses your live Stripe credentials for checkout, subscriptions, and webhooks.
            Make sure live keys and webhook secrets are saved before continuing.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {modeSwitchState.status === "error" ? (
          <p role="alert" className="px-4 text-sm text-feedback-danger-content">
            {modeSwitchState.message}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={switching}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="primary"
            disabled={switching}
            onClick={() => {
              void onConfirm()
            }}
          >
            {switching ? (
              <span className="inline-flex items-center gap-2">
                <Spinner label="" className="h-4 w-4" />
                Activating…
              </span>
            ) : (
              "Activate live mode"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
