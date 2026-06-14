import * as DialogPrimitive from "@radix-ui/react-dialog"
import { type ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { IconClose } from "@/components/ui/icons"
import { Spinner } from "@/components/ui/Spinner"
import { formIconButtonClass } from "@/components/ui/formStyles"
import { ENTER_EASE, SHEET_OPEN_MS } from "@/constants/motion"
import { cn } from "@/lib/cn"

type EmailPreviewModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  html: string | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function EmailPreviewModal({
  open,
  onOpenChange,
  title = "Order confirmation preview",
  html,
  loading,
  error,
  onRetry,
}: EmailPreviewModalProps): ReactNode {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-modal-backdrop bg-surface-overlay" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-modal flex h-[min(90vh,720px)] w-[min(96vw,720px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border-default bg-surface-raised shadow-lg",
          )}
          style={{ transitionDuration: `${SHEET_OPEN_MS}ms`, transitionTimingFunction: ENTER_EASE }}
        >
          <div className="flex items-start justify-between border-b border-border-subtle px-4 py-3 pr-12">
            <DialogPrimitive.Title className="text-base font-semibold text-content-primary">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label="Close preview" className={cn(formIconButtonClass, "absolute right-3 top-3")}>
              <IconClose size={16} />
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-surface-subtle p-4">
            {loading ? <Spinner label="Loading email preview" /> : null}
            {!loading && error !== null ? (
              <div role="alert" className="rounded-lg border border-interactive-danger-subtle p-4">
                <p className="text-sm text-content-danger">{error}</p>
                <Button type="button" variant="secondary" className="mt-4" onClick={onRetry}>
                  Retry preview
                </Button>
              </div>
            ) : null}
            {!loading && error === null && html !== null ? (
              <iframe title={`${title} email`} srcDoc={html} className="h-[min(70vh,640px)] w-full rounded-lg border border-border-default bg-surface-default" sandbox="" />
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
