export type ProductContentRecord = {
  id: string
  product_id: string
  description_rich: Record<string, unknown> | null
  seo_title: string | null
  seo_description: string | null
  seo_og_image_id: string | null
  media_gallery: string[] | null
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

export type CategoryContentRecord = {
  id: string
  category_id: string
  description_rich: Record<string, unknown> | null
  seo_title: string | null
  seo_description: string | null
  seo_og_image_id: string | null
  banner_image_id: string | null
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

export type ResolvedProductContent = {
  id: string
  product_id: string
  locale: string
  description_rich: unknown
  seo_title: string | null
  seo_description: string | null
  seo_og_image_id: string | null
  media_gallery: string[] | null
}

export type ResolvedCategoryContent = {
  id: string
  category_id: string
  locale: string
  description_rich: unknown
  seo_title: string | null
  seo_description: string | null
  seo_og_image_id: string | null
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
