import type { ReactNode } from "react"

type CardProps = {
  children: ReactNode
  className?: string
}

/**
 * Token-backed surface for panels and list/detail sections.
 * Extend via `className` for optional accents (e.g. left border).
 */
export function Card({ children, className = "" }: CardProps): JSX.Element {
  return (
    <div
      className={`rounded-lg border border-border-default bg-surface-default p-6 shadow-sm ${className}`.trim()}
    >
      {children}
    </div>
  )
}
