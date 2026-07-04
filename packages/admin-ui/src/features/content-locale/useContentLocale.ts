import { useMemo, useState } from "react"

import type { AdminLocale } from "./types"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

export const DEFAULT_CONTENT_LOCALE_CODE = "en"

type UseContentLocaleOptions = {
  locales: AdminLocale[]
  /** Preferred code when locales load; must exist in the list to take effect. */
  preferredCode?: string
  /** Restores the last editing locale for this entity (e.g. from sessionStorage). */
  initialLocaleCode?: string | null
}

type UseContentLocaleResult = {
  /** Locale shown in the selector (user choice). */
  activeLocaleCode: string
  /**
   * Locale used for CMS read/write. Matches `activeLocaleCode` except while locales
   * are still loading and on first paint before the Medusa preferred code is applied.
   */
  editingLocaleCode: string
  setActiveLocaleCode: (code: string) => void
  activeLocale: AdminLocale | null
}

function resolveEditingLocaleCode(
  locales: AdminLocale[],
  activeLocaleCode: string,
  preferredCode: string | undefined
): string {
  const fallback = preferredCode ?? DEFAULT_CONTENT_LOCALE_CODE
  if (locales.length === 0) {
    return fallback
  }

  const byCode = new Map(locales.map((locale) => [locale.code, locale]))
  if (byCode.has(activeLocaleCode)) {
    if (
      activeLocaleCode === DEFAULT_CONTENT_LOCALE_CODE &&
      preferredCode !== undefined &&
      preferredCode !== activeLocaleCode &&
      byCode.has(preferredCode)
    ) {
      return preferredCode
    }
    return activeLocaleCode
  }

  if (preferredCode !== undefined && byCode.has(preferredCode)) {
    return preferredCode
  }

  return locales[0]?.code ?? DEFAULT_CONTENT_LOCALE_CODE
}

/**
 * Admin-only editing locale: keeps `activeLocaleCode` in sync with the
 * locale list returned by Medusa (no store/region mutation).
 */
export function useContentLocale(options: UseContentLocaleOptions): UseContentLocaleResult {
  const { locales, preferredCode, initialLocaleCode } = options
  const [activeLocaleCode, setActiveLocaleCode] = useState<string>(
    initialLocaleCode ?? DEFAULT_CONTENT_LOCALE_CODE
  )

  const localeCodesKey = locales.map((locale) => locale.code).join("\u0000")

  const editingLocaleCode = useMemo(
    (): string => resolveEditingLocaleCode(locales, activeLocaleCode, preferredCode),
    [locales, activeLocaleCode, preferredCode]
  )

  useAdjustStateWhenKeyChanges(locales.length === 0 ? null : localeCodesKey, () => {
    const byCode = new Map(locales.map((locale) => [locale.code, locale]))

    if (
      initialLocaleCode !== undefined &&
      initialLocaleCode !== null &&
      byCode.has(initialLocaleCode)
    ) {
      setActiveLocaleCode(initialLocaleCode)
      return
    }

    if (!byCode.has(activeLocaleCode)) {
      const next =
        preferredCode !== undefined && byCode.has(preferredCode)
          ? preferredCode
          : (locales[0]?.code ?? DEFAULT_CONTENT_LOCALE_CODE)
      setActiveLocaleCode(next)
      return
    }

    if (
      activeLocaleCode === DEFAULT_CONTENT_LOCALE_CODE &&
      preferredCode !== undefined &&
      preferredCode !== activeLocaleCode &&
      byCode.has(preferredCode)
    ) {
      setActiveLocaleCode(preferredCode)
    }
  })

  const activeLocale =
    locales.find((locale) => locale.code === activeLocaleCode) ?? null

  return {
    activeLocaleCode,
    editingLocaleCode,
    setActiveLocaleCode,
    activeLocale,
  }
}
