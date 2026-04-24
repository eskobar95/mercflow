/**
 * Resolved product content for one locale, aligned with the admin
 * `GET/POST /admin/products/:id/content` success payload (`content` field).
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
 * JSON body for `POST /admin/products/:id/content` (partial updates allowed).
 * Mirrors content-module `productContentBodySchema` without pulling Zod into the UI.
 */
export type SaveProductContentBody = {
  description_rich?: unknown
  seo_title?: string | null
  seo_description?: string | null
  seo_og_image_id?: string | null
  media_gallery?: string[] | null
}
