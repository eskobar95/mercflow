import * as DialogPrimitive from "@radix-ui/react-dialog"
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react"

import { IconClose } from "@/components/ui/icons"
import { DRAWER_EASE, SHEET_CLOSE_MS, SHEET_OPEN_MS } from "@/constants/motion"
import { cn } from "@/lib/cn"

import { formIconButtonClass } from "./formStyles"

type SheetSide = "right" | "bottom"

type SheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  side?: SheetSide
}

/**
 * Slide-over panel — right on desktop, bottom sheet on mobile.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "right",
}: SheetProps): JSX.Element {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-modal-backdrop bg-surface-overlay",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
            "transition-opacity duration-200 motion-reduce:transition-none",
          )}
          style={{ transitionTimingFunction: DRAWER_EASE }}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-modal flex flex-col border border-border-default bg-surface-raised shadow-lg",
            "transition-[transform,opacity] motion-reduce:transition-none",
            side === "right"
              ? "inset-y-0 right-0 h-full w-full max-w-md data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:h-auto max-sm:max-h-[85vh] max-sm:max-w-none max-sm:rounded-t-xl max-sm:data-[state=closed]:translate-x-0 max-sm:data-[state=closed]:translate-y-full max-sm:data-[state=open]:translate-y-0"
              : "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-xl data-[state=closed]:translate-y-full data-[state=open]:translate-y-0",
          )}
          style={{
            transitionDuration: `${SHEET_OPEN_MS}ms`,
            transitionTimingFunction: DRAWER_EASE,
          }}
        >
          {/* Drag handle — shown on mobile (right→bottom) and always for side="bottom" */}
          <div
            aria-hidden
            className={cn(
              "mx-auto h-1 w-8 rounded-full bg-border-default",
              side === "bottom" ? "mt-2.5 mb-0 block" : "mt-2.5 mb-0 hidden max-sm:block",
            )}
          />
          <div className="flex items-start justify-between border-b border-border-subtle px-4 py-3">
            <div>
              <DialogPrimitive.Title className="text-base font-semibold text-content-primary">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm text-content-secondary">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close
              aria-label="Close panel"
              className={cn(formIconButtonClass, "min-h-11 min-w-11 shrink-0")}
            >
              <IconClose size={16} />
            </DialogPrimitive.Close>
          </div>
          {children ? <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div> : null}
          {footer ? (
            <div className="border-t border-border-subtle px-4 py-3">{footer}</div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export const SheetTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>(function SheetTrigger(props, ref) {
  return <DialogPrimitive.Trigger ref={ref} {...props} />
})

export { SHEET_CLOSE_MS, SHEET_OPEN_MS }
