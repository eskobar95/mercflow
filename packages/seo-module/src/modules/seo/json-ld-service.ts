import type { JsonLdScriptPayload, JsonLdSettings } from "./json-ld-types"
import { DEFAULT_JSON_LD_SETTINGS } from "./json-ld-types"
import { absoluteUrlFromStorefront } from "./utils/absolute-url"
import { categoryPublicPathFromHandle, productPublicPathFromHandle } from "./utils/paths"

export type ProductJsonLdInput = {
  storefrontUrl: string
  productUrl: string
  name: string
  description: string | null
  imageUrl: string | null
  sku: string | null
  price: string | null
  currency: string | null
  availability: "InStock" | "OutOfStock" | null
  settings?: JsonLdSettings
}

export type CategoryBreadcrumbItem = {
  name: string
  url: string
}

export type CategoryJsonLdInput = {
  storefrontUrl: string
  breadcrumbs: CategoryBreadcrumbItem[]
  settings?: JsonLdSettings
}

export type GlobalJsonLdInput = {
  storefrontUrl: string
  orgName: string | null
  orgLogoUrl: string | null
  orgSocialUrls: Record<string, unknown> | null
  settings?: JsonLdSettings
}

function settingsEnabled(
  settings: JsonLdSettings | undefined,
  key: keyof JsonLdSettings
): boolean {
  const resolved = settings ?? DEFAULT_JSON_LD_SETTINGS
  return resolved[key] !== false
}

function wrapGraph(graph: Record<string, unknown>[]): JsonLdScriptPayload {
  return {
    "@context": "https://schema.org",
    "@graph": graph,
  }
}

function socialSameAs(orgSocialUrls: Record<string, unknown> | null): string[] {
  if (!orgSocialUrls) {
    return []
  }
  const urls: string[] = []
  for (const value of Object.values(orgSocialUrls)) {
    if (typeof value === "string" && value.trim().length > 0) {
      urls.push(value.trim())
    }
  }
  return urls
}

export function buildProductJsonLd(input: ProductJsonLdInput): JsonLdScriptPayload | null {
  if (!settingsEnabled(input.settings, "product")) {
    return null
  }

  const graph: Record<string, unknown>[] = []
  const productId = `${input.productUrl}#product`
  const offerId = `${input.productUrl}#offer`

  const productNode: Record<string, unknown> = {
    "@type": "Product",
    "@id": productId,
    name: input.name,
    url: input.productUrl,
  }
  if (input.description) {
    productNode.description = input.description
  }
  if (input.imageUrl) {
    productNode.image = input.imageUrl
  }
  if (input.sku) {
    productNode.sku = input.sku
  }
  graph.push(productNode)

  if (input.price && input.currency) {
    const offer: Record<string, unknown> = {
      "@type": "Offer",
      "@id": offerId,
      url: input.productUrl,
      priceCurrency: input.currency,
      price: input.price,
      itemOffered: { "@id": productId },
    }
    if (input.availability) {
      offer.availability = `https://schema.org/${input.availability}`
    }
    graph.push(offer)
  }

  return wrapGraph(graph)
}

export function buildCategoryJsonLd(input: CategoryJsonLdInput): JsonLdScriptPayload | null {
  if (!settingsEnabled(input.settings, "category")) {
    return null
  }
  if (input.breadcrumbs.length === 0) {
    return null
  }

  const itemListElement = input.breadcrumbs.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.name,
    item: crumb.url,
  }))

  return wrapGraph([
    {
      "@type": "BreadcrumbList",
      itemListElement,
    },
  ])
}

export function buildGlobalJsonLd(input: GlobalJsonLdInput): JsonLdScriptPayload | null {
  if (!settingsEnabled(input.settings, "global")) {
    return null
  }

  const graph: Record<string, unknown>[] = []
  const siteUrl = absoluteUrlFromStorefront(input.storefrontUrl, "/")

  if (input.orgName && input.orgName.trim().length > 0) {
    const org: Record<string, unknown> = {
      "@type": "Organization",
      name: input.orgName.trim(),
      url: siteUrl,
    }
    if (input.orgLogoUrl) {
      org.logo = input.orgLogoUrl
    }
    const sameAs = socialSameAs(input.orgSocialUrls)
    if (sameAs.length > 0) {
      org.sameAs = sameAs
    }
    graph.push(org)
  }

  graph.push({
    "@type": "WebSite",
    name: input.orgName?.trim() || new URL(siteUrl).hostname,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl.replace(/\/$/, "")}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  })

  return wrapGraph(graph)
}

export function productPublicUrl(storefrontUrl: string, handle: string): string {
  return absoluteUrlFromStorefront(storefrontUrl, productPublicPathFromHandle(handle))
}

export function categoryPublicUrl(storefrontUrl: string, handle: string): string {
  return absoluteUrlFromStorefront(storefrontUrl, categoryPublicPathFromHandle(handle))
}
