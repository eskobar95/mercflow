import * as SwitchPrimitive from "@radix-ui/react-switch"
import { forwardRef, type ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/cn"

type SwitchProps = ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & {
  label?: string
}

/**
 * Toggle switch — Radix with MercFlow accent track.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { className, label, id, ...rest },
  ref,
) {
  const control = (
    <SwitchPrimitive.Root
      ref={ref}
      id={id}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border-default bg-surface-subtle",
        "transition-[background-color,border-color] duration-150",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      {...rest}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-surface-raised shadow-sm",
          "transition-transform duration-150 will-change-transform",
          "data-[state=checked]:translate-x-[1.375rem]",
          "motion-reduce:transition-none",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      />
    </SwitchPrimitive.Root>
  )

  if (!label) {
    return control
  }

  return (
    <label
      htmlFor={id}
      className="inline-flex min-h-11 cursor-pointer items-center gap-3"
    >
      {control}
      <span className="text-sm text-content-primary">{label}</span>
    </label>
  )
})
