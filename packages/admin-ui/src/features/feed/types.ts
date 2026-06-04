export type FeedConfigDto = {
  id: string
  store_id: string
  storefront_url: string | null
  excluded_product_ids: string[]
  excluded_category_ids: string[]
  default_condition: string
}

export type FeedAdminOverviewDto = {
  product_count: number
  variant_count: number
  validation_issue_count: number
  last_updated_at: string | null
  feed_url: string | null
}

export type FeedValidationIssueDto = {
  product_id: string
  product_title: string | null
  variant_id: string | null
  variant_sku: string | null
  missing_fields: string[]
}

export type FeedValidationSummaryDto = {
  products_checked: number
  products_with_issues: number
  issue_count: number
}

export type FeedConfigResponseDto = {
  feed_config: FeedConfigDto | null
  overview: FeedAdminOverviewDto
}

export type FeedValidationResponseDto = {
  validation: {
    issues: FeedValidationIssueDto[]
    summary: FeedValidationSummaryDto
  }
}

export type FeedConfigUpdateInput = {
  storefront_url?: string | null
  excluded_product_ids?: string[]
  excluded_category_ids?: string[]
  default_condition?: string
}
