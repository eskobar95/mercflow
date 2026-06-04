export type ContentPublishStatus = "draft" | "published"

export type ProductContentRecord = {
  id: string
  product_id: string
  locale: string
  body_json: Record<string, unknown> | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  status: ContentPublishStatus
  version: number
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

export type CategoryContentRecord = {
  id: string
  category_id: string
  locale: string
  body_json: Record<string, unknown> | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  banner_image_url: string | null
  status: ContentPublishStatus
  version: number
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

export type ResolvedProductContent = {
  id: string
  product_id: string
  locale: string
  version: number
  /** TipTap JSON — same shape as stored `body_json`. */
  description_rich: unknown
  seo_title: string | null
  seo_description: string | null
  /** Legacy API field — mirrors `og_image_url` when present. */
  seo_og_image_id: string | null
  /** Deprecated in storage; kept in API as `null` until a gallery model exists. */
  media_gallery: string[] | null
}

export type ResolvedCategoryContent = {
  id: string
  category_id: string
  locale: string
  version: number
  /** Row-level CMS publish state in `category_content`. */
  cms_status: ContentPublishStatus
  description_rich: unknown
  seo_title: string | null
  seo_description: string | null
  seo_og_image_id: string | null
  /** Legacy API field — mirrors `banner_image_url` when present. */
  banner_image_id: string | null
}

export type UpsertProductContentInput = {
  description_rich?: unknown
  seo_title?: string | null
  seo_description?: string | null
  seo_og_image_id?: string | null
  media_gallery?: string[] | null
}

export type UpsertCategoryContentInput = {
  description_rich?: unknown
  seo_title?: string | null
  seo_description?: string | null
  seo_og_image_id?: string | null
  banner_image_id?: string | null
}

export type ArticleRecord = {
  id: string
  slug: string
  title: string
  body_json: Record<string, unknown> | null
  locale: string
  status: ContentPublishStatus
  published_at: Date | null
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

export type CreateArticleInput = {
  title: string
  slug?: string | null
  body_json?: unknown
  locale?: string
  status?: ContentPublishStatus
  published_at?: Date | null
}

export type UpdateArticleInput = {
  title?: string
  slug?: string | null
  body_json?: unknown
  locale?: string
  status?: ContentPublishStatus
  published_at?: Date | null
}

export type CmsPageType = "homepage" | "landing" | "content"

export type CmsPageRecord = {
  id: string
  slug: string
  title: string
  page_type: CmsPageType
  status: ContentPublishStatus
  locale: string
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

export type AdminPageListRow = CmsPageRecord & { block_count: number }

export type StorePublishedPagePayload = {
  title: string
  slug: string
  page_type: CmsPageType
  status: ContentPublishStatus
  blocks: unknown[]
}
