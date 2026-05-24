import { forwardRef, type TextareaHTMLAttributes } from "react"

import { fieldClassName } from "./formStyles"

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean
}

/**
 * Plain textarea for short notes and SEO fields — not rich text.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, error = false, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={fieldClassName({
          error,
          className: `${className ?? ""} min-h-24 resize-y py-2`,
        })}
        style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        {...rest}
      />
    )
  },
)
