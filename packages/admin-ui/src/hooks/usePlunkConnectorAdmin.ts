import { useCallback, useEffect, useState } from "react"

import type { PlunkConnectorAdminDto } from "@/features/connectors/parsePlunkConnectorResponse"
import {
  type PatchPlunkConnectorPayload,
  type PlunkTestResultDto,
  getPlunkConnectorAdmin,
  patchPlunkConnectorAdmin,
  postPlunkConnectorTest,
} from "@/features/connectors/plunkConnectorAdminApi"

type UsePlunkConnectorAdminState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; dto: PlunkConnectorAdminDto }

type UsePlunkConnectorAdminApi = {
  state: UsePlunkConnectorAdminState
  reload: () => Promise<void>
  saving: boolean
  testing: boolean
  operationalError: string | null
  /** Last outbound test outcome banner (persists across minor interactions). */
  lastProbe: PlunkTestResultDto | null
  save: (patch: PatchPlunkConnectorPayload) => Promise<void>
  probe: (body: { test_email?: string }) => Promise<void>
}

export function usePlunkConnectorAdmin(): UsePlunkConnectorAdminApi {
  const [phase, setPhase] = useState<UsePlunkConnectorAdminState>({ phase: "loading" })
  const [saving, setSaving] = useState<boolean>(false)
  const [testing, setTesting] = useState<boolean>(false)
  const [operationalError, setOperationalError] = useState<string | null>(null)
  const [lastProbe, setLastProbe] = useState<PlunkTestResultDto | null>(null)

  const reload = useCallback(async (): Promise<void> => {
    setOperationalError(null)
    setPhase({ phase: "loading" })
    try {
      const dto = await getPlunkConnectorAdmin()
      setPhase({ phase: "ready", dto })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to load Plunk connector."
      setPhase({ phase: "error", message: msg })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const save = useCallback(async (patch: PatchPlunkConnectorPayload): Promise<void> => {
    setSaving(true)
    setOperationalError(null)
    try {
      const dto = await patchPlunkConnectorAdmin(patch)
      setPhase({ phase: "ready", dto })
      setLastProbe(null)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Saving Plunk credentials encountered an unexpected error."
      setOperationalError(msg)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  const probe = useCallback(async (body: { test_email?: string }): Promise<void> => {
    setTesting(true)
    setOperationalError(null)
    try {
      const result = await postPlunkConnectorTest(body)
      setLastProbe(result)
      const dto = await getPlunkConnectorAdmin()
      setPhase({ phase: "ready", dto })
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Plunk connection test encountered an unexpected error."
      setOperationalError(msg)
    } finally {
      setTesting(false)
    }
  }, [])

  return {
    state: phase,
    reload,
    saving,
    testing,
    operationalError,
    lastProbe,
    save,
    probe,
  }
}
