export type SlugStrategy = "nordic" | "omit"

export type RedirectType = "auto" | "manual"

export type MercflowSeoConfigRecord = {
  id: string
  store_id: string
  storefront_url: string | null
  slug_strategy: SlugStrategy
  org_name: string | null
  org_logo_url: string | null
  org_social_urls: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type MercflowRedirectRecord = {
  id: string
  store_id: string
  from_path: string
  to_path: string
  type: RedirectType
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type UpsertSeoConfigInput = {
  storefront_url?: string | null
  slug_strategy?: SlugStrategy
  org_name?: string | null
  org_logo_url?: string | null
  org_social_urls?: Record<string, unknown> | null
}

export type CreateRedirectInput = {
  from_path: string
  to_path: string
  type?: RedirectType
}
