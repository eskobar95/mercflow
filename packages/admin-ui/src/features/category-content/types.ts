/**
 * Resolved category content for one locale, aligned with the admin
 * `GET/POST /admin/product-categories/:id/content` success payload (`content` field).
 */
export type CategoryContentResolved = {
  id: string
  category_id: string
  locale: string
  description_rich: unknown
  seo_title: string | null
  seo_description: string | null
  seo_og_image_id: string | null
  banner_image_id: string | null
}

/**
 * Flat JSON from `GET /admin/category-content/:id` — matches MercFlow product CMS admin read payloads
 * plus `category_id`, `banner_image_url`, and `version`.
 */
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

/**
 * JSON body for `POST /admin/product-categories/:id/content` (partial updates allowed).
 * Category content has `banner_image_id` and does not include `media_gallery`.
 */
export type SaveCategoryContentBody = {
  description_rich?: unknown
  seo_title?: string | null
  seo_description?: string | null
  seo_og_image_id?: string | null
  banner_image_id?: string | null
}
