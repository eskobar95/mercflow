import type { JSONContent } from "@tiptap/core"

import type { ProductContentResolved } from "@/features/product-content/types"

import { tiptapDocFromUnknown } from "./tiptapDoc"

function stableDocJson(doc: JSONContent): string {
  return JSON.stringify(doc)
}

function normalizeGallery(ids: string[] | null | undefined): string {
  if (ids === null || ids === undefined || ids.length === 0) {
    return ""
  }
  return [...ids].sort().join("\u0001")
}

export type ProductContentFormSnapshot = {
  descriptionJson: JSONContent
  seoTitle: string
  seoDescription: string
  ogImageId: string
  galleryIds: string[]
}

/**
 * Whether the in-progress form differs from the last loaded server snapshot.
 * When `content` is null (initial load failed), treats as not dirty so locale changes stay usable.
 */
export function isProductContentDirty(
  content: ProductContentResolved | null,
  form: ProductContentFormSnapshot
): boolean {
  if (content === null) {
    return false
  }

  const baselineDoc = stableDocJson(tiptapDocFromUnknown(content.description_rich))
  const currentDoc = stableDocJson(form.descriptionJson)
  if (baselineDoc !== currentDoc) {
    return true
  }

  const baseTitle = content.seo_title ?? ""
  if (baseTitle !== form.seoTitle) {
    return true
  }

  const baseDesc = content.seo_description ?? ""
  if (baseDesc !== form.seoDescription) {
    return true
  }

  const baseOg = content.seo_og_image_id ?? ""
  if (baseOg !== form.ogImageId) {
    return true
  }

  if (normalizeGallery(content.media_gallery) !== normalizeGallery(form.galleryIds)) {
    return true
  }

  return false
}
