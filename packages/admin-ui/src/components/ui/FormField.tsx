import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react"

import { cn } from "@/lib/cn"

import { formErrorClass, formHintClass } from "./formStyles"
import { Label } from "./Label"

type FormFieldProps = {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}

type AriaFieldProps = {
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

function enhanceControl(
  child: ReactNode,
  ariaProps: AriaFieldProps,
): ReactNode {
  const only = Children.only(child)
  if (!isValidElement(only)) return child

  const existing = only.props as AriaFieldProps
  return cloneElement(only as ReactElement<AriaFieldProps>, {
    id: existing.id ?? ariaProps.id,
    "aria-describedby": ariaProps["aria-describedby"],
    "aria-invalid": ariaProps["aria-invalid"],
  })
}

/**
 * Form field wrapper — label, optional hint, control slot, error message.
 * ARIA attributes are injected onto the child control (not a wrapper div).
 */
export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  className,
  children,
}: FormFieldProps): JSX.Element {
  const generatedId = useId()
  const fieldId = htmlFor ?? generatedId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      {enhanceControl(children, {
        id: fieldId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {hint ? (
        <p id={hintId} className={formHintClass}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={formErrorClass} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
