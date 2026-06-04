export type SlugStrategy = "nordic" | "omit"

export type SeoConfigDto = {
  id: string
  store_id: string
  storefront_url: string | null
  slug_strategy: SlugStrategy
  org_name: string | null
  org_logo_url: string | null
  org_social_urls: Record<string, unknown> | null
}

export type RedirectDto = {
  id: string
  store_id: string
  from_path: string
  to_path: string
  type: "auto" | "manual"
  has_chain_warning?: boolean
}
