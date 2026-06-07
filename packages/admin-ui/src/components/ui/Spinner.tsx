import type { ReactNode } from "react"
import { cn } from "@/lib/cn"

type SpinnerProps = {
  size?: "sm" | "md" | "lg"
  label?: string
  className?: string
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
}

/**
 * Inline loading spinner — fast rotation for perceived performance.
 */
export function Spinner({
  size = "md",
  label = "Loading",
  className,
}: SpinnerProps): ReactNode {
  return (
    <output
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <span
        aria-hidden
        className={cn(
          "animate-spin rounded-full border-border-subtle border-t-accent",
          sizeMap[size],
          "motion-reduce:animate-none motion-reduce:border-t-border-strong",
        )}
        style={{ animationDuration: "650ms" }}
      />
    </output>
  )
}
