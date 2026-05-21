import { useMatches } from "react-router-dom"

import type { AppRouteHandle } from "@/router"

const DEFAULT_TITLE = "Dashboard"

/**
 * Resolves the page title from the deepest matched route `handle.title`.
 */
export function useRouteTitle(): string {
  const matches = useMatches()

  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]
    if (!match) continue
    const handle = match.handle as AppRouteHandle | undefined
    if (handle?.title) {
      return handle.title
    }
  }

  return DEFAULT_TITLE
}
