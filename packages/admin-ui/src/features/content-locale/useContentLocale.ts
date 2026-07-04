import { useState } from "react"

import type { AdminLocale } from "./types"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

export const DEFAULT_CONTENT_LOCALE_CODE = "en"

type UseContentLocaleOptions = {
  locales: AdminLocale[]
  /** Preferred code when locales load; must exist in the list to take effect. */
  preferredCode?: string
}

type UseContentLocaleResult = {
  activeLocaleCode: string
  setActiveLocaleCode: (code: string) => void
  activeLocale: AdminLocale | null
}

/**
 * Admin-only editing locale: keeps `activeLocaleCode` in sync with the
 * locale list returned by Medusa (no store/region mutation).
 */
export function useContentLocale(options: UseContentLocaleOptions): UseContentLocaleResult {
  const { locales, preferredCode } = options
  const [activeLocaleCode, setActiveLocaleCode] = useState<string>(DEFAULT_CONTENT_LOCALE_CODE)

  const localeCodesKey = locales.map((locale) => locale.code).join("\u0000")

  useAdjustStateWhenKeyChanges(locales.length === 0 ? null : localeCodesKey, () => {
    const byCode = new Map(locales.map((locale) => [locale.code, locale]))
    if (byCode.has(activeLocaleCode)) {
      return
    }
    const fallback =
      (preferredCode !== undefined && byCode.has(preferredCode) ? preferredCode : undefined) ??
      locales[0]?.code ??
      DEFAULT_CONTENT_LOCALE_CODE
    setActiveLocaleCode(fallback)
  })

  const activeLocale =
    locales.find((locale) => locale.code === activeLocaleCode) ?? null

  return {
    activeLocaleCode,
    setActiveLocaleCode,
    activeLocale,
  }
}
