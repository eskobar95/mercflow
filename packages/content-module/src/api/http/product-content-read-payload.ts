import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"

import type { ResolvedProductContent } from "../../modules/content/types"

export type ProductContentReadPayload = {
  id: string
  product_id: string
  locale: string
  version: number
  body_json: unknown | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  status: string
}

function looksLikeAbsoluteHttpUrl(raw: string): boolean {
  return /^https?:\/\//i.test(raw.trim())
}

export async function resolveOgImageUrl(
  scope: MedusaContainer,
  seoOgImageId: string | null | undefined
): Promise<string | null> {
  if (seoOgImageId == null || seoOgImageId === "") {
    return null
  }
  const trimmed = seoOgImageId.trim()
  if (looksLikeAbsoluteHttpUrl(trimmed)) {
    return trimmed
  }
  try {
    const fileModule = scope.resolve(Modules.FILE) as IFileModuleService
    const file = await fileModule.retrieveFile(trimmed)
    const url = file?.url
    return typeof url === "string" && url.length > 0 ? url : null
  } catch {
    return null
  }
}

export async function mapResolvedToReadPayload(
  scope: MedusaContainer,
  resolved: ResolvedProductContent,
  productStatus: string
): Promise<ProductContentReadPayload> {
  const og_image_url = await resolveOgImageUrl(scope, resolved.seo_og_image_id)
  return {
    id: resolved.id,
    product_id: resolved.product_id,
    locale: resolved.locale,
    version: resolved.version,
    body_json: resolved.description_rich ?? null,
    seo_title: resolved.seo_title,
    seo_description: resolved.seo_description,
    og_image_url,
    status: productStatus,
  }
}
