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

export type GoogleShoppingFeedItem = {
  id: string
  title: string
  description: string
  link: string
  image_link: string | null
  price: string
  availability: "in stock" | "out of stock" | "preorder"
  brand: string | null
  condition: string
}

export type FeedCatalogVariant = {
  id: string
  sku: string | null
  manage_inventory: boolean | null
  inventory_quantity: number | null
  prices: Array<{ amount: number | string | null; currency_code: string | null }>
}

export type FeedCatalogProduct = {
  id: string
  title: string | null
  handle: string | null
  description: string | null
  status: string | null
  thumbnail: string | null
  category_ids: string[]
  variants: FeedCatalogVariant[]
}
