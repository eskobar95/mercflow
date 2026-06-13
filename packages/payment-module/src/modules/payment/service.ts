import type { Context } from "@medusajs/types"
import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import EncryptionService from "./encryption-service"
import { MercflowPaymentProviderConfig } from "./models"
import { StripePaymentProvider, verifyStripeWebhookSignature } from "./providers/stripe-payment-provider"
import { runWithTenantScope } from "./tenant-scope"
import type {
  IPaymentProvider,
  PaymentMode,
  PaymentProviderConfigRecord,
  PaymentProviderKey,
  PublicProviderConfig,
  ResolvedProviderCredentials,
  UpsertProviderConfigInput,
} from "./types"
import { PAYMENT_MODES, PAYMENT_PROVIDERS } from "./types"

function unwrapCreated<T>(result: T | T[]): T {
  return Array.isArray(result) ? result[0]! : result
}

function isPaymentProviderKey(value: string): value is PaymentProviderKey {
  return (PAYMENT_PROVIDERS as readonly string[]).includes(value)
}

function isPaymentMode(value: string): value is PaymentMode {
  return (PAYMENT_MODES as readonly string[]).includes(value)
}

function toPublicConfigRecord(
  row: Record<string, unknown>,
  publishableKey: string | null
): PublicProviderConfig {
  const provider = typeof row.provider === "string" ? row.provider : "stripe"
  const mode = typeof row.mode === "string" ? row.mode : "test"
  if (!isPaymentProviderKey(provider)) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Payment config "${String(row.id)}" has invalid provider "${provider}"`
    )
  }
  if (!isPaymentMode(mode)) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Payment config "${String(row.id)}" has invalid mode "${mode}"`
    )
  }

  return {
    id: String(row.id),
    store_id: String(row.store_id),
    provider,
    test_publishable_key: (row.test_publishable_key as string | null | undefined) ?? null,
    live_publishable_key: (row.live_publishable_key as string | null | undefined) ?? null,
    mode,
    publishable_key: publishableKey,
    created_at: row.created_at as string | Date,
    updated_at: row.updated_at as string | Date,
    deleted_at: (row.deleted_at as string | Date | null | undefined) ?? null,
  }
}

function resolvePublishableKey(
  row: Record<string, unknown>,
  mode: PaymentMode
): string | null {
  if (mode === "live") {
    return (row.live_publishable_key as string | null | undefined) ?? null
  }
  return (row.test_publishable_key as string | null | undefined) ?? null
}

function resolveEncryptedSecretKey(
  row: Record<string, unknown>,
  mode: PaymentMode
): string | null {
  if (mode === "live") {
    return (row.live_secret_key as string | null | undefined) ?? null
  }
  return (row.test_secret_key as string | null | undefined) ?? null
}

function resolveWebhookSecret(
  row: Record<string, unknown>,
  mode: PaymentMode
): string | null {
  if (mode === "live") {
    return (row.live_webhook_secret as string | null | undefined) ?? null
  }
  return (row.test_webhook_secret as string | null | undefined) ?? null
}

class PaymentModuleService extends MedusaService({
  MercflowPaymentProviderConfig,
}) {
  private encryptionLazy: EncryptionService | null = null

  setEncryptionService(service: EncryptionService): void {
    this.encryptionLazy = service
  }

  private getEncryption(): EncryptionService {
    this.encryptionLazy ??= new EncryptionService()
    return this.encryptionLazy
  }

  async withTenant<T>(
    storeId: string,
    fn: (context: Context) => Promise<T>
  ): Promise<T> {
    const baseRepo = (
      this as unknown as {
        baseRepository_: Parameters<typeof runWithTenantScope>[0]
      }
    ).baseRepository_
    return runWithTenantScope(baseRepo, storeId, fn)
  }

  private resolveCredentialsFromRow(
    row: Record<string, unknown>
  ): ResolvedProviderCredentials {
    const mode = typeof row.mode === "string" ? row.mode : "test"
    if (!isPaymentMode(mode)) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Payment config "${String(row.id)}" has invalid mode "${mode}"`
      )
    }

    const encryptedSecret = resolveEncryptedSecretKey(row, mode)
    if (encryptedSecret === null || encryptedSecret.trim() === "") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `No ${mode} secret key configured for this store`
      )
    }

    const encryption = this.getEncryption()
    const secretKey = encryption.decrypt(encryptedSecret)

    return {
      secretKey,
      publishableKey: resolvePublishableKey(row, mode),
      webhookSecret: resolveWebhookSecret(row, mode),
      mode,
    }
  }

  private createProviderInstance(
    provider: PaymentProviderKey,
    credentials: ResolvedProviderCredentials
  ): IPaymentProvider {
    switch (provider) {
      case "stripe":
        return new StripePaymentProvider({ credentials })
      case "mobilepay":
      case "klarna":
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Payment provider "${provider}" is not implemented yet`
        )
      default: {
        const exhaustive: never = provider
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `Unknown payment provider "${String(exhaustive)}"`
        )
      }
    }
  }

  async getProviderConfig(
    storeId: string,
    provider: PaymentProviderKey = "stripe"
  ): Promise<PublicProviderConfig | null> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowPaymentProviderConfigs(
        { store_id: storeId, provider },
        { take: 1 },
        context
      )
      const row = rows[0]
      if (row === undefined) {
        return null
      }
      const record = row as Record<string, unknown>
      const mode = typeof record.mode === "string" ? record.mode : "test"
      const resolvedMode = isPaymentMode(mode) ? mode : "test"
      return toPublicConfigRecord(record, resolvePublishableKey(record, resolvedMode))
    })
  }

  async getPublishableKey(
    storeId: string,
    provider: PaymentProviderKey = "stripe"
  ): Promise<string | null> {
    const config = await this.getProviderConfig(storeId, provider)
    return config?.publishable_key ?? null
  }

  async getActiveProvider(
    storeId: string,
    provider: PaymentProviderKey = "stripe"
  ): Promise<IPaymentProvider> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowPaymentProviderConfigs(
        { store_id: storeId, provider },
        { take: 1 },
        context
      )
      const row = rows[0]
      if (row === undefined) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Payment provider config not found for store ${storeId}`
        )
      }

      const record = row as Record<string, unknown>
      const providerKey = typeof record.provider === "string" ? record.provider : provider
      if (!isPaymentProviderKey(providerKey)) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `Payment config has invalid provider "${providerKey}"`
        )
      }

      const credentials = this.resolveCredentialsFromRow(record)
      return this.createProviderInstance(providerKey, credentials)
    })
  }

  async upsertProviderConfig(
    storeId: string,
    input: UpsertProviderConfigInput
  ): Promise<PublicProviderConfig> {
    if (!isPaymentProviderKey(input.provider)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid payment provider "${String(input.provider)}"`
      )
    }
    if (input.mode !== undefined && !isPaymentMode(input.mode)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid payment mode "${String(input.mode)}"`
      )
    }

    const encryption = this.getEncryption()

    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowPaymentProviderConfigs(
        { store_id: storeId, provider: input.provider },
        { take: 1 },
        context
      )

      const payload: Record<string, unknown> = {}

      if (input.test_publishable_key !== undefined) {
        payload.test_publishable_key = input.test_publishable_key
      }
      if (input.live_publishable_key !== undefined) {
        payload.live_publishable_key = input.live_publishable_key
      }
      if (input.test_webhook_secret !== undefined) {
        payload.test_webhook_secret = input.test_webhook_secret
      }
      if (input.live_webhook_secret !== undefined) {
        payload.live_webhook_secret = input.live_webhook_secret
      }
      if (input.test_secret_key !== undefined) {
        payload.test_secret_key =
          input.test_secret_key === null || input.test_secret_key.trim() === ""
            ? null
            : encryption.encrypt(input.test_secret_key)
      }
      if (input.live_secret_key !== undefined) {
        payload.live_secret_key =
          input.live_secret_key === null || input.live_secret_key.trim() === ""
            ? null
            : encryption.encrypt(input.live_secret_key)
      }
      if (input.mode !== undefined) {
        payload.mode = input.mode
      }

      let saved: Record<string, unknown>

      if (rows[0] !== undefined) {
        const current = rows[0] as Record<string, unknown>
        if (Object.keys(payload).length === 0) {
          saved = current
        } else {
          saved = unwrapCreated(
            await this.updateMercflowPaymentProviderConfigs(
              payload,
              { id: String(current.id) },
              context
            )
          ) as Record<string, unknown>
        }
      } else {
        saved = unwrapCreated(
          await this.createMercflowPaymentProviderConfigs(
            {
              store_id: storeId,
              provider: input.provider,
              mode: input.mode ?? "test",
              test_secret_key:
                input.test_secret_key !== undefined &&
                input.test_secret_key !== null &&
                input.test_secret_key.trim() !== ""
                  ? encryption.encrypt(input.test_secret_key)
                  : null,
              test_publishable_key: input.test_publishable_key ?? null,
              test_webhook_secret: input.test_webhook_secret ?? null,
              live_secret_key:
                input.live_secret_key !== undefined &&
                input.live_secret_key !== null &&
                input.live_secret_key.trim() !== ""
                  ? encryption.encrypt(input.live_secret_key)
                  : null,
              live_publishable_key: input.live_publishable_key ?? null,
              live_webhook_secret: input.live_webhook_secret ?? null,
            },
            context
          )
        ) as Record<string, unknown>
      }

      const mode = typeof saved.mode === "string" ? saved.mode : "test"
      const resolvedMode = isPaymentMode(mode) ? mode : "test"
      return toPublicConfigRecord(saved, resolvePublishableKey(saved, resolvedMode))
    })
  }

  async setMode(
    storeId: string,
    mode: PaymentMode,
    provider: PaymentProviderKey = "stripe"
  ): Promise<PublicProviderConfig> {
    if (!isPaymentMode(mode)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid payment mode "${mode}"`)
    }

    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowPaymentProviderConfigs(
        { store_id: storeId, provider },
        { take: 1 },
        context
      )
      const row = rows[0]
      if (row === undefined) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Payment provider config not found for store ${storeId}`
        )
      }

      const current = row as Record<string, unknown>
      const updated = unwrapCreated(
        await this.updateMercflowPaymentProviderConfigs({ mode }, { id: String(current.id) }, context)
      ) as Record<string, unknown>

      const resolvedMode = isPaymentMode(String(updated.mode)) ? (updated.mode as PaymentMode) : mode
      return toPublicConfigRecord(updated, resolvePublishableKey(updated, resolvedMode))
    })
  }

  verifyWebhookSignature(
    payload: Buffer,
    signature: string,
    secret: string
  ): boolean {
    return verifyStripeWebhookSignature(payload, signature, secret)
  }
}

export default PaymentModuleService

export {
  toPublicConfigRecord,
  resolvePublishableKey,
  resolveEncryptedSecretKey,
}

export type { PaymentProviderConfigRecord }
