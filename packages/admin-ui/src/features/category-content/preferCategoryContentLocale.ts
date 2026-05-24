/**
 * Picks Danish (`da` / `da-*`) when present in Medusa locales — same strategy as product content.
 */
export function preferCategoryContentLocale(
  locales: readonly { code: string }[],
  fallback: string
): string {
  const match = locales.find((l): boolean => {
    const normalized = l.code.trim().toLowerCase()
    return normalized === "da" || normalized.startsWith("da-")
  })
  if (match) {
    return match.code
  }
  return locales[0]?.code ?? fallback
}
