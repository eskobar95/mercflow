import * as DialogPrimitive from "@radix-ui/react-dialog"
import { forwardRef, type ComponentPropsWithoutRef, type HTMLAttributes, type ReactNode } from "react"

import { IconClose } from "@/components/ui/icons"
import { ENTER_EASE, SHEET_OPEN_MS } from "@/constants/motion"
import { cn } from "@/lib/cn"

import { formIconButtonClass } from "./formStyles"

export const DialogRoot = DialogPrimitive.Root
const Dialog = DialogRoot
const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...rest }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-modal-backdrop bg-surface-overlay",
        "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
        "transition-opacity duration-200 motion-reduce:transition-none",
        className,
      )}
      style={{ transitionTimingFunction: ENTER_EASE }}
      {...rest}
    />
  )
})

type DialogContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  showClose?: boolean
}

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent({ className, children, showClose = true, ...rest }, ref) {
    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed z-modal w-full max-w-lg border border-border-default bg-surface-raised shadow-lg",
            "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg",
            "max-sm:inset-x-0 max-sm:bottom-0 max-sm:left-0 max-sm:top-auto max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-full max-sm:rounded-b-none max-sm:rounded-t-xl",
            "data-[state=open]:max-sm:translate-y-0",
            "data-[state=open]:scale-100 data-[state=open]:opacity-100",
            "data-[state=closed]:scale-[0.95] data-[state=closed]:opacity-0",
            "data-[state=closed]:max-sm:translate-y-full data-[state=closed]:max-sm:scale-100",
            "transition-[transform,opacity] motion-reduce:transition-none",
            "origin-center max-sm:origin-bottom",
            className,
          )}
          style={{
            transitionDuration: `${SHEET_OPEN_MS}ms`,
            transitionTimingFunction: ENTER_EASE,
          }}
          {...rest}
        >
          {/* Drag handle — only visible on mobile bottom drawer */}
          <div aria-hidden className="mx-auto mb-0 mt-2.5 hidden h-1 w-8 rounded-full bg-border-default max-sm:block" />
          {children}
          {showClose ? (
            <DialogPrimitive.Close
              aria-label="Close dialog"
              className={cn(
                formIconButtonClass,
                "absolute right-3 top-3 min-h-11 min-w-11",
              )}
            >
              <IconClose size={16} />
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPortal>
    )
  },
)

function DialogHeader({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>): ReactNode {
  return (
    <div
      className={cn("border-b border-border-subtle px-4 py-3 pr-12", className)}
      {...rest}
    />
  )
}

export function DialogFooter({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>): ReactNode {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-border-subtle px-4 py-3 sm:flex-row sm:justify-end",
        className,
      )}
      {...rest}
    />
  )
}

function DialogTitle({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Title>): ReactNode {
  return (
    <DialogPrimitive.Title
      className={cn("text-base font-semibold text-content-primary", className)}
      {...rest}
    />
  )
}

function DialogDescription({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Description>): ReactNode {
  return (
    <DialogPrimitive.Description
      className={cn("mt-1 text-sm text-content-secondary", className)}
      {...rest}
    />
  )
}

type DialogShellProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
}

/** Convenience composed dialog for common confirm/content patterns. */
export function DialogShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: DialogShellProps): ReactNode {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children ? <div className="px-4 py-3">{children}</div> : null}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}
