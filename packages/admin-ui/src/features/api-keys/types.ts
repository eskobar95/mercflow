export type ApiKeyTypeDto = "publishable" | "secret"

export type ApiKeySalesChannelDto = {
  id: string
  name: string
}

export type ApiKeyDto = {
  id: string
  title: string
  type: ApiKeyTypeDto
  token: string
  redacted: string
  revoked_at: string | null
  created_at: string
  sales_channels: ApiKeySalesChannelDto[]
}

export type ApiKeyListDto = {
  api_keys: ApiKeyDto[]
  count: number
}
