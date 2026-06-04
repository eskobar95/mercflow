import { categoryPublicPathFromHandle, productPublicPathFromHandle } from "./utils/paths"
import { absoluteUrlFromStorefront } from "./utils/absolute-url"

export type CanonicalResult = {
  canonical_url: string
  source: "override" | "auto"
  conflict_warning: string | null
}

function normalizeOverride(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null
  }
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

function detectCanonicalConflict(
  overrideUrl: string,
  autoUrl: string
): string | null {
  if (overrideUrl === autoUrl) {
    return null
  }
  try {
    const override = new URL(overrideUrl)
    const auto = new URL(autoUrl)
    if (override.hostname !== auto.hostname) {
      return "Canonical override uses a different host than the auto-calculated URL for this store."
    }
    if (override.pathname !== auto.pathname) {
      return "Canonical override path differs from the product/category handle path — verify this is intentional."
    }
  } catch {
    return "Canonical override is not a valid absolute URL."
  }
  return null
}

export function buildCanonicalResult(params: {
  storefrontUrl: string
  handle: string
  pathBuilder: (handle: string) => string
  override: string | null | undefined
}): CanonicalResult {
  const autoUrl = absoluteUrlFromStorefront(
    params.storefrontUrl,
    params.pathBuilder(params.handle)
  )
  const override = normalizeOverride(params.override)
  if (override) {
    return {
      canonical_url: override,
      source: "override",
      conflict_warning: detectCanonicalConflict(override, autoUrl),
    }
  }
  return {
    canonical_url: autoUrl,
    source: "auto",
    conflict_warning: null,
  }
}

export function buildProductCanonicalCore(params: {
  storefrontUrl: string
  handle: string
  override: string | null | undefined
}): CanonicalResult {
  return buildCanonicalResult({
    ...params,
    pathBuilder: productPublicPathFromHandle,
  })
}

export function buildCategoryCanonicalCore(params: {
  storefrontUrl: string
  handle: string
  override: string | null | undefined
}): CanonicalResult {
  return buildCanonicalResult({
    ...params,
    pathBuilder: categoryPublicPathFromHandle,
  })
}
