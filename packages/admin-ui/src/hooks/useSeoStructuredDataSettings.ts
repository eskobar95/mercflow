import { useCallback, useEffect, useState } from "react"

import { getAdminSeoConfig, putAdminSeoConfig } from "@/features/seo/seoConfigApi"
import type { JsonLdSettingsDto } from "@/features/seo/types"

type SeoStructuredDataSettingsState =
  | { phase: "loading" }
  | { phase: "ready"; json_ld_settings: JsonLdSettingsDto }
  | { phase: "error"; message: string }
  | { phase: "saving"; json_ld_settings: JsonLdSettingsDto }
  | { phase: "save_error"; json_ld_settings: JsonLdSettingsDto; message: string }

type UseSeoStructuredDataSettingsReturn = {
  state: SeoStructuredDataSettingsState
  reload: () => Promise<void>
  save: (settings: JsonLdSettingsDto) => Promise<boolean>
}

export function useSeoStructuredDataSettings(): UseSeoStructuredDataSettingsReturn {
  const [state, setState] = useState<SeoStructuredDataSettingsState>({ phase: "loading" })

  const reload = useCallback(async (): Promise<void> => {
    setState({ phase: "loading" })
    try {
      const data = await getAdminSeoConfig()
      setState({ phase: "ready", json_ld_settings: data.json_ld_settings })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unexpected error loading structured data settings."
      setState({ phase: "error", message })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const save = useCallback(async (settings: JsonLdSettingsDto): Promise<boolean> => {
    setState({ phase: "saving", json_ld_settings: settings })

    try {
      const data = await putAdminSeoConfig({ json_ld_settings: settings })
      setState({ phase: "ready", json_ld_settings: data.json_ld_settings })
      return true
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unexpected error while saving."
      setState({ phase: "save_error", json_ld_settings: settings, message })
      return false
    }
  }, [])

  return { state, reload, save }
}
