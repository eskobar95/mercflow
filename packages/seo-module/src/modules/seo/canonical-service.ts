import { MedusaError } from "@medusajs/utils"

import {
  buildCategoryCanonicalCore,
  buildProductCanonicalCore,
  type CanonicalResult,
} from "./canonical-url-core"

export type { CanonicalResult }

export function buildProductCanonical(params: {
  storefrontUrl: string | null
  handle: string
  override: string | null | undefined
}): CanonicalResult {
  if (!params.storefrontUrl) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Canonical URL is not configured for this store (missing storefront_url)"
    )
  }
  return buildProductCanonicalCore({
    storefrontUrl: params.storefrontUrl,
    handle: params.handle,
    override: params.override,
  })
}

export function buildCategoryCanonical(params: {
  storefrontUrl: string | null
  handle: string
  override: string | null | undefined
}): CanonicalResult {
  if (!params.storefrontUrl) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Canonical URL is not configured for this store (missing storefront_url)"
    )
  }
  return buildCategoryCanonicalCore({
    storefrontUrl: params.storefrontUrl,
    handle: params.handle,
    override: params.override,
  })
}
