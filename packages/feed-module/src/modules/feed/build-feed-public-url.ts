const FEED_PATH = "/feed/google-shopping.xml"

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "")
}

/**
 * Public feed URL operators paste into Merchant Center (storefront origin + feed path).
 */
export function buildFeedPublicUrl(storefrontUrl: string | null | undefined): string | null {
  if (storefrontUrl == null || storefrontUrl.trim() === "") {
    return null
  }
  const override = process.env.MERCFLOW_FEED_PUBLIC_BASE_URL?.trim()
  const base = override && override.length > 0 ? override : storefrontUrl.trim()
  return `${trimTrailingSlash(base)}${FEED_PATH}`
}
