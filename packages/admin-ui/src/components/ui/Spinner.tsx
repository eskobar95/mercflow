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
}: SpinnerProps): JSX.Element {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <span
        className={cn(
          "animate-spin rounded-full border-border-subtle border-t-accent",
          sizeMap[size],
          "motion-reduce:animate-none motion-reduce:border-t-border-strong",
        )}
        style={{ animationDuration: "650ms" }}
      />
    </span>
  )
}

type LoadingOverlayProps = {
  label?: string
  className?: string
}

export function LoadingOverlay({
  label = "Loading",
  className,
}: LoadingOverlayProps): JSX.Element {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center bg-surface-default/80",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Spinner size="lg" label={label} />
    </div>
  )
}
