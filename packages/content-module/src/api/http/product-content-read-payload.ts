import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"

import type { ResolvedProductContent } from "../../modules/content/types"

export type ProductContentReadPayload = {
  body_json: unknown | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  status: string
  locale: string
}

export async function resolveOgImageUrl(
  scope: MedusaContainer,
  seoOgImageId: string | null | undefined
): Promise<string | null> {
  if (seoOgImageId == null || seoOgImageId === "") {
    return null
  }
  try {
    const fileModule = scope.resolve(
      Modules.FILE
    ) as IFileModuleService
    const file = await fileModule.retrieveFile(seoOgImageId)
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
    body_json: resolved.description_rich ?? null,
    seo_title: resolved.seo_title,
    seo_description: resolved.seo_description,
    og_image_url,
    status: productStatus,
    locale: resolved.locale,
  }
}
