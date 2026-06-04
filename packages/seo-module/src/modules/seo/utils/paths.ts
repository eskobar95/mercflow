/**
 * Normalizes redirect paths to a leading-slash form without trailing slash (except root).
 */
export function normalizeRedirectPath(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return "/"
  }
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  if (withLeading.length > 1 && withLeading.endsWith("/")) {
    return withLeading.slice(0, -1)
  }
  return withLeading
}

export function productPublicPathFromHandle(handle: string): string {
  return normalizeRedirectPath(`/${handle}`)
}

export function categoryPublicPathFromHandle(handle: string): string {
  return normalizeRedirectPath(`/categories/${handle}`)
}

/** Matches `GET /store/pages/:slug` — optional `?locale=` when not the default. */
export function pagePublicPathFromSlug(slug: string, locale: string, defaultLocale = "en"): string {
  const path = normalizeRedirectPath(`/pages/${slug}`)
  if (!locale || locale === defaultLocale) {
    return path
  }
  return `${path}?locale=${encodeURIComponent(locale)}`
}
