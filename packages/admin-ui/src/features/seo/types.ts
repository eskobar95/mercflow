export type SlugStrategy = "nordic" | "omit"

export type JsonLdSettingsDto = {
  product: boolean
  category: boolean
  global: boolean
}

export type SeoConfigDto = {
  id: string
  store_id: string
  storefront_url: string | null
  slug_strategy: SlugStrategy
  org_name: string | null
  org_logo_url: string | null
  org_social_urls: Record<string, unknown> | null
  json_ld_settings: JsonLdSettingsDto
}

export type SitemapPageType = "product" | "category" | "page"

export type SitemapPageTypeSetting = {
  priority: number
  changefreq: string
}

export type SitemapConfigDto = {
  id: string
  store_id: string
  page_type_settings: Partial<Record<SitemapPageType, SitemapPageTypeSetting>>
  excluded_product_ids: string[]
  excluded_category_ids: string[]
  excluded_page_ids: string[]
}

export type RobotsRuleDto = {
  user_agent: string
  allow: string[]
  disallow: string[]
}

export type RobotsChangeEntryDto = {
  changed_at: string
  summary: string
}

export type RobotsConfigDto = {
  id: string
  store_id: string
  structured_rules: { rules: RobotsRuleDto[] }
  freetext_override: string | null
  change_history: RobotsChangeEntryDto[]
}

export type RedirectDto = {
  id: string
  store_id: string
  from_path: string
  to_path: string
  type: "auto" | "manual"
  has_chain_warning?: boolean
}
