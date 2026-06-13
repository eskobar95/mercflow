export type PlatformTenantRow = {
  id: string
  name: string
  domain: string | null
  is_disabled: boolean
  created_at: string
}

export type ProvisionProgressEvent = {
  step: string
  message: string
  status: "pending" | "running" | "done" | "error"
}

export type ProvisionCompletePayload = {
  store_id: string
  sales_channel_id: string
  publishable_api_key: string
  admin_user_id: string
  admin_email: string
  admin_url: string
  tenant_url: string
}

export type SuspendTenantResult = {
  store_id: string
  revoked_api_key_ids: string[]
  stripe_subscription_canceled: boolean
  store_disabled: boolean
  billing_status_updated: boolean
  partial_errors: string[]
}
