import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { forwardRef, type ComponentPropsWithoutRef, type HTMLAttributes } from "react"

import { Button } from "@/components/ui/Button"
import { ENTER_EASE, SHEET_OPEN_MS } from "@/constants/motion"
import { cn } from "@/lib/cn"

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger
export const AlertDialogPortal = AlertDialogPrimitive.Portal

export const AlertDialogOverlay = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(function AlertDialogOverlay({ className, ...rest }, ref) {
  return (
    <AlertDialogPrimitive.Overlay
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

export const AlertDialogContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(function AlertDialogContent({ className, ...rest }, ref) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-modal w-full max-w-md border border-border-default bg-surface-raised shadow-lg",
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg",
          "max-sm:bottom-0 max-sm:top-auto max-sm:max-w-none max-sm:translate-y-full max-sm:rounded-b-none max-sm:rounded-t-xl",
          "data-[state=open]:max-sm:translate-y-0",
          "data-[state=open]:scale-100 data-[state=open]:opacity-100",
          "data-[state=closed]:scale-[0.95] data-[state=closed]:opacity-0",
          "data-[state=closed]:max-sm:translate-y-full data-[state=closed]:max-sm:scale-100",
          "transition-[transform,opacity] motion-reduce:transition-none origin-center max-sm:origin-bottom",
          className,
        )}
        style={{
          transitionDuration: `${SHEET_OPEN_MS}ms`,
          transitionTimingFunction: ENTER_EASE,
        }}
        {...rest}
      />
    </AlertDialogPortal>
  )
})

export function AlertDialogHeader({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div className={cn("border-b border-border-subtle px-4 py-3", className)} {...rest} />
  )
}

export function AlertDialogFooter({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
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

export const AlertDialogTitle = forwardRef<
  HTMLHeadingElement,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(function AlertDialogTitle({ className, ...rest }, ref) {
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cn("text-base font-semibold text-content-primary", className)}
      {...rest}
    />
  )
})

export const AlertDialogDescription = forwardRef<
  HTMLParagraphElement,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(function AlertDialogDescription({ className, ...rest }, ref) {
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn("mt-1 text-sm text-content-secondary", className)}
      {...rest}
    />
  )
})

export const AlertDialogCancel = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(function AlertDialogCancel({ className, ...rest }, ref) {
  return (
    <AlertDialogPrimitive.Cancel ref={ref} asChild>
      <Button variant="secondary" className={className} {...rest} />
    </AlertDialogPrimitive.Cancel>
  )
})

export const AlertDialogAction = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(function AlertDialogAction({ className, ...rest }, ref) {
  return (
    <AlertDialogPrimitive.Action ref={ref} asChild>
      <Button variant="primary" className={className} {...rest} />
    </AlertDialogPrimitive.Action>
  )
})

export const AlertDialogDestructiveAction = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(function AlertDialogDestructiveAction({ className, ...rest }, ref) {
  return (
    <AlertDialogPrimitive.Action ref={ref} asChild>
      <Button variant="destructive" className={className} {...rest} />
    </AlertDialogPrimitive.Action>
  )
})
