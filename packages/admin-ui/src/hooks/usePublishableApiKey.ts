import { useCallback, useEffect, useState } from "react"

import {
  listPublishableApiKeys,
  revokeAndRegeneratePublishableApiKey,
} from "@/features/api-keys/apiKeysAdminApi"
import type { ApiKeyDto } from "@/features/api-keys/types"

export type PublishableApiKeyState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; key: ApiKeyDto; revealedToken: string | null }

type UsePublishableApiKeyResult = PublishableApiKeyState & {
  reload: () => void
  regenerate: () => Promise<void>
  isRegenerating: boolean
  regenerateError: string | null
}

export function usePublishableApiKey(): UsePublishableApiKeyResult {
  const [state, setState] = useState<PublishableApiKeyState>({ status: "loading" })
  const [reloadToken, setReloadToken] = useState(0)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)

  const reload = useCallback((): void => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      setState({ status: "loading" })
      try {
        const keys = await listPublishableApiKeys()
        if (cancelled) return
        const activeKey = keys[0] ?? null
        if (activeKey === null) {
          setState({ status: "empty" })
          return
        }
        setState({ status: "success", key: activeKey, revealedToken: null })
      } catch (error: unknown) {
        if (cancelled) return
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load publishable API key. Check your backend URL and try again."
        setState({ status: "error", message })
      }
    }

    void load()
    return (): void => {
      cancelled = true
    }
  }, [reloadToken])

  const regenerate = useCallback(async (): Promise<void> => {
    if (state.status !== "success") return

    setIsRegenerating(true)
    setRegenerateError(null)
    try {
      const result = await revokeAndRegeneratePublishableApiKey(state.key)
      setState({ status: "success", key: result.key, revealedToken: result.revealedToken })
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not revoke and regenerate the API key."
      setRegenerateError(message)
    } finally {
      setIsRegenerating(false)
    }
  }, [state])

  return { ...state, reload, regenerate, isRegenerating, regenerateError }
}
