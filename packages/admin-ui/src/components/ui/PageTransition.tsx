import type { ReactNode } from "react"

type PageTransitionProps = {
  children: ReactNode
}

/**
 * Wraps page-level content. All route-level views should use this so transitions
 * stay consistent when animation is added later.
 */
export function PageTransition({ children }: PageTransitionProps): JSX.Element {
  return <div className="min-w-0 flex-1">{children}</div>
}
