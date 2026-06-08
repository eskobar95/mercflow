export const MERCFLOW_STORE_PATH_PREFIXES = [
  "/store/seo",
  "/store/articles",
  "/store/pages",
  "/store/product-content",
  "/store/category-content",
  "/store/connectors",
] as const

export function isMercflowOwnedStorePath(pathname: string): boolean {
  return MERCFLOW_STORE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isMercflowPublicPath(pathname: string): boolean {
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    return true
  }
  return pathname.startsWith("/feed/")
}

export function shouldRedirectToV1(pathname: string): boolean {
  if (pathname.startsWith("/v1/")) {
    return false
  }
  return isMercflowOwnedStorePath(pathname) || isMercflowPublicPath(pathname)
}

export function buildV1RedirectTarget(pathname: string, search: string): string {
  const query = search.length > 0 ? search : ""
  return `/v1${pathname}${query}`
}
