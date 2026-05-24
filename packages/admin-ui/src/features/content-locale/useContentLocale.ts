import { useEffect, useState } from "react"

import type { AdminLocale } from "./types"

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

  useEffect(() => {
    if (locales.length === 0) {
      return
    }
    const byCode = new Map(locales.map((l) => [l.code, l]))
    if (byCode.has(activeLocaleCode)) {
      return
    }
    const fallback =
      (preferredCode !== undefined && byCode.has(preferredCode) ? preferredCode : undefined) ??
      locales[0]?.code ??
      DEFAULT_CONTENT_LOCALE_CODE
    setActiveLocaleCode(fallback)
  }, [locales, activeLocaleCode, preferredCode])

  const activeLocale =
    locales.find((locale) => locale.code === activeLocaleCode) ?? null

  return {
    activeLocaleCode,
    setActiveLocaleCode,
    activeLocale,
  }
}
