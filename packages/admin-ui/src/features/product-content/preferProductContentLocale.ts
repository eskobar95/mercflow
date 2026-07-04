/**
 * Default editing locale from Medusa's locale list (first entry), without forcing Danish.
 * Content rows are locale-specific — auto-picking `da-DK` breaks reload when CMS data
 * was saved under another code such as `en-US`.
 */
export function preferProductContentLocale(
  locales: readonly { code: string }[],
  fallback: string
): string {
  return locales[0]?.code ?? fallback
}
