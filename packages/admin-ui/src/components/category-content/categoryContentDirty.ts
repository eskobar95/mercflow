import type { JSONContent } from "@tiptap/core"

import { tiptapDocFromUnknown } from "@/lib/tiptap"
import type { CategoryContentResolved } from "@/features/category-content/types"

function stableDocJson(doc: JSONContent): string {
  return JSON.stringify(doc)
}

export type CategoryContentFormSnapshot = {
  descriptionJson: JSONContent
  seoTitle: string
  seoDescription: string
  ogImageId: string
  bannerImageId: string
}

/**
 * Whether the in-progress form differs from the last loaded server snapshot.
 * When `content` is null (initial load failed), treats as not dirty so locale changes stay usable.
 */
export function isCategoryContentDirty(
  content: CategoryContentResolved | null,
  form: CategoryContentFormSnapshot
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

  const baseBanner = content.banner_image_id ?? ""
  if (baseBanner !== form.bannerImageId) {
    return true
  }

  return false
}
