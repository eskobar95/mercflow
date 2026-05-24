import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { forwardRef, type ComponentPropsWithoutRef } from "react"

import { IconCheck } from "@/components/ui/icons"
import { cn } from "@/lib/cn"

type CheckboxProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  label?: string
}

/**
 * Radix checkbox — 44px touch target, token-backed states.
 */
export const Checkbox = forwardRef<
  HTMLButtonElement,
  CheckboxProps
>(function Checkbox({ className, label, id, ...rest }, ref) {
  const control = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={id}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        className,
      )}
      {...rest}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border border-border-default bg-surface-default",
          "transition-[background-color,border-color,color,transform] duration-150",
          "data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-content-inverse",
          "active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center">
          <IconCheck size={12} />
        </CheckboxPrimitive.Indicator>
      </span>
    </CheckboxPrimitive.Root>
  )

  if (!label) {
    return control
  }

  return (
    <label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center gap-2">
      {control}
      <span className="text-sm text-content-primary">{label}</span>
    </label>
  )
})
