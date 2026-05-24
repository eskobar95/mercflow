import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { forwardRef, type ComponentPropsWithoutRef } from "react"

import { IconCheck } from "@/components/ui/icons"
import { fieldFocusClass } from "@/components/ui/formStyles"
import { cn } from "@/lib/cn"

type CheckboxProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  label?: string
  /** Expand hit area to 44px without changing the visible square control. */
  touchTarget?: boolean
}

/**
 * Square checkbox — 16px control, accent fill when checked.
 * Touch target is optional and invisible (Mercury / Stripe table pattern).
 */
export const Checkbox = forwardRef<
  HTMLButtonElement,
  CheckboxProps
>(function Checkbox(
  { className, label, id, touchTarget = false, ...rest },
  ref,
) {
  const control = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={id}
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border-strong bg-surface-default",
        "transition-[background-color,border-color,color,transform] duration-150",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-content-inverse",
        "data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent data-[state=indeterminate]:text-content-inverse",
        fieldFocusClass,
        "disabled:cursor-not-allowed disabled:opacity-50",
        "active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      {...rest}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <IconCheck size={11} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )

  if (label) {
    return (
      <label
        htmlFor={id}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2.5"
      >
        {touchTarget ? (
          <span className="flex h-11 w-11 items-center justify-center">{control}</span>
        ) : (
          control
        )}
        <span className="text-sm text-content-primary">{label}</span>
      </label>
    )
  }

  if (touchTarget) {
    return (
      <span className="inline-flex h-11 w-11 items-center justify-center">
        {control}
      </span>
    )
  }

  return control
})
