export type FeedConfigRecord = {
  id: string
  store_id: string
  storefront_url: string | null
  excluded_product_ids: string[]
  excluded_category_ids: string[]
  default_condition: string
}

export type UpdateFeedConfigInput = {
  storefront_url?: string | null
  excluded_product_ids?: string[]
  excluded_category_ids?: string[]
  default_condition?: string
}
