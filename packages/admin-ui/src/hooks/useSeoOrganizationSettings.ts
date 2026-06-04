import { useCallback, useEffect, useState } from "react"

import { getAdminSeoConfig, putAdminSeoConfig } from "@/features/seo/seoConfigApi"
import type { SeoConfigDto } from "@/features/seo/types"

export type SeoOrganizationFormValues = {
  storefront_url: string
  org_name: string
  org_logo_url: string
  social_facebook: string
  social_instagram: string
  social_linkedin: string
}

type SeoOrganizationSettingsState =
  | { phase: "loading" }
  | { phase: "ready"; values: SeoOrganizationFormValues }
  | { phase: "error"; message: string }
  | { phase: "saving"; values: SeoOrganizationFormValues }
  | { phase: "save_error"; values: SeoOrganizationFormValues; message: string }

function valuesFromConfig(config: SeoConfigDto): SeoOrganizationFormValues {
  const social = config.org_social_urls ?? {}
  const readSocial = (key: string): string => {
    const raw = social[key]
    return typeof raw === "string" ? raw : ""
  }
  return {
    storefront_url: config.storefront_url ?? "",
    org_name: config.org_name ?? "",
    org_logo_url: config.org_logo_url ?? "",
    social_facebook: readSocial("facebook"),
    social_instagram: readSocial("instagram"),
    social_linkedin: readSocial("linkedin"),
  }
}

function socialPayload(values: SeoOrganizationFormValues): Record<string, string> | null {
  const out: Record<string, string> = {}
  if (values.social_facebook.trim()) {
    out.facebook = values.social_facebook.trim()
  }
  if (values.social_instagram.trim()) {
    out.instagram = values.social_instagram.trim()
  }
  if (values.social_linkedin.trim()) {
    out.linkedin = values.social_linkedin.trim()
  }
  return Object.keys(out).length > 0 ? out : null
}

type UseSeoOrganizationSettingsReturn = {
  state: SeoOrganizationSettingsState
  reload: () => Promise<void>
  save: (values: SeoOrganizationFormValues) => Promise<boolean>
}

export function useSeoOrganizationSettings(): UseSeoOrganizationSettingsReturn {
  const [state, setState] = useState<SeoOrganizationSettingsState>({ phase: "loading" })

  const reload = useCallback(async (): Promise<void> => {
    setState({ phase: "loading" })
    try {
      const data = await getAdminSeoConfig()
      setState({ phase: "ready", values: valuesFromConfig(data) })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unexpected error loading organisation settings."
      setState({ phase: "error", message })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const save = useCallback(async (values: SeoOrganizationFormValues): Promise<boolean> => {
    setState({ phase: "saving", values })
    try {
      const data = await putAdminSeoConfig({
        storefront_url: values.storefront_url.trim() === "" ? null : values.storefront_url.trim(),
        org_name: values.org_name.trim() === "" ? null : values.org_name.trim(),
        org_logo_url: values.org_logo_url.trim() === "" ? null : values.org_logo_url.trim(),
        org_social_urls: socialPayload(values),
      })
      setState({ phase: "ready", values: valuesFromConfig(data) })
      return true
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unexpected error while saving."
      setState({ phase: "save_error", values, message })
      return false
    }
  }, [])

  return { state, reload, save }
}
