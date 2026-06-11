import { useState, type ReactNode } from "react"

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

type SubscriptionPauseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  productLabel: string | null
  isSubmitting: boolean
  onConfirm: (resumeDate: string | null) => void
}

function toIsoDateTime(value: string): string | null {
  if (value.trim() === "") {
    return null
  }
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toISOString()
}

export function SubscriptionPauseDialog({
  open,
  onOpenChange,
  productLabel,
  isSubmitting,
  onConfirm,
}: SubscriptionPauseDialogProps): ReactNode {
  const [resumeDate, setResumeDate] = useState<string>("")

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setResumeDate("")
        }
        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pause subscription?</AlertDialogTitle>
          <AlertDialogDescription>
            {productLabel ?? "This subscription"} will stop renewing until you resume it.
            Optionally choose a date to auto-resume.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-4 py-3">
          <label htmlFor="subscription-pause-resume-date" className="text-sm font-medium text-content-primary">
            Resume on (optional)
          </label>
          <input
            id="subscription-pause-resume-date"
            type="date"
            value={resumeDate}
            onChange={(event) => {
              setResumeDate(event.target.value)
            }}
            className="mt-2 h-9 w-full rounded-md border border-border-default bg-surface-default px-3 text-sm text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={isSubmitting}>
            Keep active
          </AlertDialogCancel>
          <Button
            type="button"
            variant="primary"
            disabled={isSubmitting}
            onClick={() => {
              onConfirm(toIsoDateTime(resumeDate))
            }}
          >
            Pause subscription
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
