import type { JSONContent } from "@tiptap/core"

import type { CategoryContentReadPayload } from "@/features/category-content/types"

import { tiptapDocFromUnknown } from "@/lib/tiptap"

function stableDocJson(doc: JSONContent): string {
  return JSON.stringify(doc)
}

export type CategoryContentFormSnapshot = {
  descriptionJson: JSONContent
  seoTitle: string
  seoDescription: string
  ogImageUrl: string
  bannerImageUrl: string
}

/**
 * Whether the in-progress form differs from the last loaded server snapshot.
 * When `content` is null, treats as not dirty.
 */
export function isCategoryContentDirty(
  content: CategoryContentReadPayload | null,
  form: CategoryContentFormSnapshot
): boolean {
  if (content === null) {
    return false
  }

  const baselineDoc = stableDocJson(tiptapDocFromUnknown(content.body_json))
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

  const baseOg = content.og_image_url ?? ""
  if (baseOg !== form.ogImageUrl) {
    return true
  }

  const baseBanner = content.banner_image_url ?? ""
  if (baseBanner !== form.bannerImageUrl) {
    return true
  }

  return false
}
