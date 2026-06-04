export function trimStorefrontUrl(url: string): string {
  return url.replace(/\/+$/, "")
}

export function absoluteUrlFromStorefront(storefrontUrl: string, path: string): string {
  const base = trimStorefrontUrl(storefrontUrl)
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalizedPath}`
}
