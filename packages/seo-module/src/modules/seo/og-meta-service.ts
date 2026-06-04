export type OgMetaTags = {
  "og:title": string
  "og:description": string
  "og:image": string | null
  "og:url": string
  "og:type": string
  "twitter:card": string
  "twitter:title": string
  "twitter:description": string
  "twitter:image": string | null
}

export type OgMetaInput = {
  pageUrl: string
  title: string
  description: string
  imageUrl: string | null
  type?: "product" | "website"
}

export function buildOgMetaTags(input: OgMetaInput): OgMetaTags {
  const type = input.type ?? "website"
  const card = input.imageUrl ? "summary_large_image" : "summary"
  return {
    "og:title": input.title,
    "og:description": input.description,
    "og:image": input.imageUrl,
    "og:url": input.pageUrl,
    "og:type": type === "product" ? "product" : "website",
    "twitter:card": card,
    "twitter:title": input.title,
    "twitter:description": input.description,
    "twitter:image": input.imageUrl,
  }
}

export function resolveOgTitle(seoTitle: string | null, fallbackTitle: string): string {
  const trimmed = seoTitle?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : fallbackTitle.trim()
}

export function resolveOgDescription(
  seoDescription: string | null,
  fallbackDescription: string | null
): string {
  const trimmed = seoDescription?.trim() ?? ""
  if (trimmed.length > 0) {
    return trimmed
  }
  const fallback = fallbackDescription?.trim() ?? ""
  return fallback.length > 0 ? fallback : ""
}
