import { useEffect, useRef } from "react"

type UseUnsavedFormGuardParams = {
  isDirty: boolean
  /** Document title when the form has no unsaved changes. */
  baseTitle: string
  enabled?: boolean
}

/**
 * Prefixes `document.title` with `• ` when dirty and registers a `beforeunload` guard.
 * Restores the clean title on unmount and when `isDirty` becomes false.
 */
export function useUnsavedFormGuard(params: UseUnsavedFormGuardParams): void {
  const { isDirty, baseTitle, enabled = true } = params
  const cleanTitleRef = useRef(baseTitle)

  useEffect(() => {
    cleanTitleRef.current = baseTitle
  }, [baseTitle])

  useEffect(() => {
    if (!enabled) {
      return
    }

    document.title = isDirty ? `• ${baseTitle}` : baseTitle
  }, [baseTitle, enabled, isDirty])

  useEffect(() => {
    if (!enabled || !isDirty) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [enabled, isDirty])

  useEffect(() => {
    return () => {
      document.title = cleanTitleRef.current
    }
  }, [])
}
