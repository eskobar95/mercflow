import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"

import { cn } from "@/lib/cn"

import { fieldClassName } from "./formStyles"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Shows error border styling when true. */
  error?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

/**
 * Text input primitive — token-backed, optional leading/trailing icons.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    error = false,
    leadingIcon,
    trailingIcon,
    disabled,
    type = "text",
    ...rest
  },
  ref,
) {
  if (leadingIcon || trailingIcon) {
    return (
      <div
        className={cn(
          "relative flex w-full items-center",
          disabled ? "opacity-100" : "",
        )}
      >
        {leadingIcon ? (
          <span
            className="pointer-events-none absolute left-3 text-content-tertiary"
            aria-hidden
          >
            {leadingIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={cn(
            fieldClassName({ error, className }),
            leadingIcon ? "pl-9" : "",
            trailingIcon ? "pr-9" : "",
          )}
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
          {...rest}
        />
        {trailingIcon ? (
          <span
            className="pointer-events-none absolute right-3 text-content-tertiary"
            aria-hidden
          >
            {trailingIcon}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <input
      ref={ref}
      type={type}
      disabled={disabled}
      className={fieldClassName({ error, className })}
      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      {...rest}
    />
  )
})
