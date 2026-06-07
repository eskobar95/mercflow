import type { JSONContent } from "@tiptap/core"

import type { ProductContentReadPayload } from "@/features/product-content/types"

import { tiptapDocFromUnknown } from "@/lib/tiptap"

function stableDocJson(doc: JSONContent): string {
  return JSON.stringify(doc)
}

type ProductContentFormSnapshot = {
  descriptionJson: JSONContent
  seoTitle: string
  seoDescription: string
  ogImageUrl: string
  canonicalUrlOverride: string
}

export function isProductContentDirty(
  content: ProductContentReadPayload | null,
  form: ProductContentFormSnapshot
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

  const baseCanonical = content.canonical_url_override ?? ""
  if (baseCanonical !== form.canonicalUrlOverride) {
    return true
  }

  return false
}
