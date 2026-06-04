import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"

import { CONTENT_MODULE } from "@mercflow/content-module"

type ContentModuleReader = {
  findByProductId: (
    productId: string,
    locale: string
  ) => Promise<{
    seo_description: string | null
    seo_og_image_id: string | null
    media_gallery: string[] | null
  } | null>
}

function looksLikeAbsoluteHttpUrl(raw: string): boolean {
  return /^https?:\/\//i.test(raw.trim())
}

async function resolveOgImageUrl(
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

export async function loadProductContentForFeed(
  scope: MedusaContainer,
  productId: string,
  locale: string
): Promise<{ seo_description: string | null; image_url: string | null }> {
  const contentService = scope.resolve(CONTENT_MODULE) as ContentModuleReader
  const resolved = await contentService.findByProductId(productId, locale)
  if (!resolved) {
    return { seo_description: null, image_url: null }
  }
  const galleryFirst =
    Array.isArray(resolved.media_gallery) && resolved.media_gallery.length > 0
      ? resolved.media_gallery[0]?.trim() || null
      : null
  const ogUrl = await resolveOgImageUrl(scope, resolved.seo_og_image_id)
  return {
    seo_description: resolved.seo_description,
    image_url: galleryFirst ?? ogUrl,
  }
}
