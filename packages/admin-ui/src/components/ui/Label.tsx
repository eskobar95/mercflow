import * as RadixLabel from "@radix-ui/react-label"
import { forwardRef, type ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/cn"

import { formLabelClass } from "./formStyles"

type LabelProps = ComponentPropsWithoutRef<typeof RadixLabel.Root> & {
  required?: boolean
}

/**
 * Accessible form label — Radix Label with MercFlow typography.
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, children, required = false, ...rest },
  ref,
) {
  return (
    <RadixLabel.Root
      ref={ref}
      className={cn(formLabelClass, className)}
      {...rest}
    >
      {children}
      {required ? (
        <span className="text-feedback-danger-content" aria-hidden>
          {" "}
          *
        </span>
      ) : null}
    </RadixLabel.Root>
  )
})
