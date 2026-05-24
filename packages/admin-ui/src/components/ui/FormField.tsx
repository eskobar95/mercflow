import { useId, type ReactNode } from "react"

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

/**
 * Form field wrapper — label, optional hint, control slot, error message.
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
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      {hint ? (
        <p id={hintId} className={formHintClass}>
          {hint}
        </p>
      ) : null}
      <div
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
      >
        {children}
      </div>
      {error ? (
        <p id={errorId} className={formErrorClass} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
