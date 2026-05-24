import { useCallback, useEffect, useState } from "react"

import {
  getAdminGtmConnector,
  patchAdminGtmConnector,
} from "@/features/connectors/gtmConnectorApi"

type GtmSettingsState =
  | { phase: "loading" }
  | { phase: "ready"; container_id: string | null }
  | { phase: "error"; message: string }
  | { phase: "saving"; container_id: string | null }
  | {
      phase: "save_error"
      container_id: string | null
      message: string
    }

type UseGtmConnectorSettingsReturn = {
  state: GtmSettingsState
  reload: () => Promise<void>
  save: (containerIdRaw: string) => Promise<boolean>
}

export function useGtmConnectorSettings(): UseGtmConnectorSettingsReturn {
  const [state, setState] = useState<GtmSettingsState>({ phase: "loading" })

  const reload = useCallback(async (): Promise<void> => {
    setState({ phase: "loading" })
    try {
      const data = await getAdminGtmConnector()
      setState({ phase: "ready", container_id: data.container_id })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unexpected error loading settings."
      setState({ phase: "error", message })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const save = useCallback(async (containerIdRaw: string): Promise<boolean> => {
    let rollback: string | null = null

    setState((prev) => {
      if (
        prev.phase === "ready" ||
        prev.phase === "save_error" ||
        prev.phase === "saving"
      ) {
        rollback = prev.container_id
      }

      return { phase: "saving", container_id: rollback }
    })

    try {
      const normalized = containerIdRaw.trim().toUpperCase()
      const data = await patchAdminGtmConnector({ container_id: normalized })
      setState({ phase: "ready", container_id: data.container_id })
      return true
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unexpected error while saving."
      try {
        const refreshed = await getAdminGtmConnector()
        setState({
          phase: "save_error",
          container_id: refreshed.container_id,
          message,
        })
      } catch {
        setState({
          phase: "save_error",
          container_id: rollback,
          message,
        })
      }
      return false
    }
  }, [])

  return { state, reload, save }
}
