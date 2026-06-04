export type SitemapPageType = "product" | "category" | "page"

export type SitemapPageTypeSetting = {
  priority: number
  changefreq: string
}

export type SitemapPageTypeSettings = Partial<
  Record<SitemapPageType, SitemapPageTypeSetting>
>

export type MercflowSitemapConfigRecord = {
  id: string
  store_id: string
  page_type_settings: SitemapPageTypeSettings
  excluded_product_ids: string[]
  excluded_category_ids: string[]
  excluded_page_ids: string[]
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type UpsertSitemapConfigInput = {
  page_type_settings?: SitemapPageTypeSettings
  excluded_product_ids?: string[]
  excluded_category_ids?: string[]
  excluded_page_ids?: string[]
}

export type SitemapUrlEntry = {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: number
}
