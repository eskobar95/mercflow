import type { MedusaContainer } from "@medusajs/framework/types"

import type { ResolvedCategoryContent } from "../../modules/content/types"

import { resolveOgImageUrl } from "./product-content-read-payload"

export type CategoryContentReadPayload = {
  id: string
  category_id: string
  locale: string
  version: number
  body_json: unknown | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  banner_image_url: string | null
  status: string
}

export async function mapResolvedCategoryToReadPayload(
  scope: MedusaContainer,
  resolved: ResolvedCategoryContent,
  catalogVisibilityStatus: string
): Promise<CategoryContentReadPayload> {
  const [og_image_url, banner_image_url] = await Promise.all([
    resolveOgImageUrl(scope, resolved.seo_og_image_id),
    resolveOgImageUrl(scope, resolved.banner_image_id),
  ])
  return {
    id: resolved.id,
    category_id: resolved.category_id,
    locale: resolved.locale,
    version: resolved.version,
    body_json: resolved.description_rich ?? null,
    seo_title: resolved.seo_title,
    seo_description: resolved.seo_description,
    og_image_url,
    banner_image_url,
    status: catalogVisibilityStatus,
  }
}
