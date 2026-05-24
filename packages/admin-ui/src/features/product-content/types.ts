/**
 * Flat JSON payload for `GET` / `POST` / `PATCH` MercFlow CMS product-content admin routes.
 */
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

/**
 * @deprecated Legacy envelope shape (`{ content }`); prefer `ProductContentReadPayload`.
 */
export type ProductContentResolved = {
  id: string
  product_id: string
  locale: string
  description_rich: unknown
  seo_title: string | null
  seo_description: string | null
  seo_og_image_id: string | null
  media_gallery: string[] | null
}

/**
 * JSON body for Mutations (`POST/PATCH`).
 * Mirrors content-module `productContentBodySchema` without pulling Zod into the UI.
 */
export type SaveProductContentBody = {
  description_rich?: unknown
  seo_title?: string | null
  seo_description?: string | null
  seo_og_image_id?: string | null
  media_gallery?: string[] | null
}
