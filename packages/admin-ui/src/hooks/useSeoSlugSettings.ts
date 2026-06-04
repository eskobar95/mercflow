import { useCallback, useEffect, useState } from "react"

import { getAdminSeoConfig, putAdminSeoConfig } from "@/features/seo/seoConfigApi"
import type { SlugStrategy } from "@/features/seo/types"

type SeoSlugSettingsState =
  | { phase: "loading" }
  | { phase: "ready"; slug_strategy: SlugStrategy }
  | { phase: "error"; message: string }
  | { phase: "saving"; slug_strategy: SlugStrategy }
  | { phase: "save_error"; slug_strategy: SlugStrategy; message: string }

type UseSeoSlugSettingsReturn = {
  state: SeoSlugSettingsState
  reload: () => Promise<void>
  save: (strategy: SlugStrategy) => Promise<boolean>
}

export function useSeoSlugSettings(): UseSeoSlugSettingsReturn {
  const [state, setState] = useState<SeoSlugSettingsState>({ phase: "loading" })

  const reload = useCallback(async (): Promise<void> => {
    setState({ phase: "loading" })
    try {
      const data = await getAdminSeoConfig()
      setState({ phase: "ready", slug_strategy: data.slug_strategy })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unexpected error loading SEO settings."
      setState({ phase: "error", message })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const save = useCallback(async (strategy: SlugStrategy): Promise<boolean> => {
    let rollback: SlugStrategy = "nordic"
    setState((prev) => {
      if (prev.phase === "ready" || prev.phase === "save_error" || prev.phase === "saving") {
        rollback = prev.slug_strategy
      }
      return { phase: "saving", slug_strategy: rollback }
    })

    try {
      const data = await putAdminSeoConfig({ slug_strategy: strategy })
      setState({ phase: "ready", slug_strategy: data.slug_strategy })
      return true
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unexpected error while saving."
      setState({ phase: "save_error", slug_strategy: rollback, message })
      return false
    }
  }, [])

  return { state, reload, save }
}
