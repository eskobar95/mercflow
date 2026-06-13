import type { PaymentMode, PaymentProviderKey, PublicProviderConfig } from "./types"

export type PaymentProviderAdminDto = {
  id: string | null
  store_id: string
  provider: PaymentProviderKey
  mode: PaymentMode
  publishable_key: string | null
  test_publishable_key: string | null
  live_publishable_key: string | null
  test_has_secret_key: boolean
  live_has_secret_key: boolean
  test_has_webhook_secret: boolean
  live_has_webhook_secret: boolean
  configured: boolean
}

function hasNonEmptySecret(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== ""
}

function hasNonEmptyWebhook(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== ""
}

export function paymentProviderAdminDtoFromRow(
  storeId: string,
  provider: PaymentProviderKey,
  row: Record<string, unknown> | null,
  publicConfig: PublicProviderConfig | null
): PaymentProviderAdminDto {
  if (row === null || publicConfig === null) {
    return {
      id: null,
      store_id: storeId,
      provider,
      mode: "test",
      publishable_key: null,
      test_publishable_key: null,
      live_publishable_key: null,
      test_has_secret_key: false,
      live_has_secret_key: false,
      test_has_webhook_secret: false,
      live_has_webhook_secret: false,
      configured: false,
    }
  }

  const testHasSecret = hasNonEmptySecret(row.test_secret_key)
  const liveHasSecret = hasNonEmptySecret(row.live_secret_key)
  const testHasWebhook = hasNonEmptyWebhook(row.test_webhook_secret)
  const liveHasWebhook = hasNonEmptyWebhook(row.live_webhook_secret)

  return {
    id: publicConfig.id,
    store_id: publicConfig.store_id,
    provider: publicConfig.provider,
    mode: publicConfig.mode,
    publishable_key: publicConfig.publishable_key,
    test_publishable_key: publicConfig.test_publishable_key,
    live_publishable_key: publicConfig.live_publishable_key,
    test_has_secret_key: testHasSecret,
    live_has_secret_key: liveHasSecret,
    test_has_webhook_secret: testHasWebhook,
    live_has_webhook_secret: liveHasWebhook,
    configured: testHasSecret || liveHasSecret,
  }
}
