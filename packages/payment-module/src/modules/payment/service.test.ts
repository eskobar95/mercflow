import { describe, expect, it, vi } from "vitest"
import { MedusaError } from "@medusajs/utils"

import EncryptionService from "./encryption-service"
import PaymentModuleService, {
  resolveEncryptedSecretKey,
  resolvePublishableKey,
  toPublicConfigRecord,
} from "./service"
import { PaymentNotImplementedError } from "./providers/payment-not-implemented"
import { StripePaymentProvider } from "./providers/stripe-payment-provider"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const TEST_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

function createServiceStub(
  overrides: Record<string, unknown>
): PaymentModuleService {
  const withTenant = vi.fn(
    async <T>(
      _storeId: string,
      fn: (context: { transactionManager: unknown }) => Promise<T>
    ): Promise<T> => fn({ transactionManager: {} })
  )

  const encryption = new EncryptionService({ keyHex: TEST_KEY })

  const svc = Object.create(PaymentModuleService.prototype) as PaymentModuleService
  Object.assign(svc, { withTenant, ...overrides })
  svc.setEncryptionService(encryption)
  return svc
}

describe("PaymentModuleService", (): void => {
  it("getProviderConfig returns null when no row exists", async (): Promise<void> => {
    const listMercflowPaymentProviderConfigs = vi.fn().mockResolvedValue([])
    const svc = createServiceStub({ listMercflowPaymentProviderConfigs })

    const config = await svc.getProviderConfig(STORE_A)
    expect(config).toBeNull()
  })

  it("getPublishableKey returns mode-appropriate publishable key", async (): Promise<void> => {
    const listMercflowPaymentProviderConfigs = vi.fn().mockResolvedValue([
      {
        id: "ppc_1",
        store_id: STORE_A,
        provider: "stripe",
        mode: "test",
        test_publishable_key: "pk_test_abc",
        live_publishable_key: "pk_live_xyz",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ])
    const svc = createServiceStub({ listMercflowPaymentProviderConfigs })

    const key = await svc.getPublishableKey(STORE_A)
    expect(key).toBe("pk_test_abc")
  })

  it("upsertProviderConfig encrypts secret keys and never returns them", async (): Promise<void> => {
    const encryption = new EncryptionService({ keyHex: TEST_KEY })
    const createMercflowPaymentProviderConfigs = vi.fn().mockImplementation(
      async (payload: Record<string, unknown>) => [
        {
          id: "ppc_1",
          store_id: STORE_A,
          provider: "stripe",
          mode: "test",
          test_secret_key: payload.test_secret_key,
          test_publishable_key: payload.test_publishable_key,
          test_webhook_secret: payload.test_webhook_secret,
          live_secret_key: null,
          live_publishable_key: null,
          live_webhook_secret: null,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        },
      ]
    )
    const listMercflowPaymentProviderConfigs = vi.fn().mockResolvedValue([])
    const svc = createServiceStub({
      createMercflowPaymentProviderConfigs,
      listMercflowPaymentProviderConfigs,
    })
    svc.setEncryptionService(encryption)

    const saved = await svc.upsertProviderConfig(STORE_A, {
      provider: "stripe",
      test_secret_key: "test_secret_value",
      test_publishable_key: "test_publishable_pub",
      test_webhook_secret: "test_webhook_secret",
    })

    expect(saved.publishable_key).toBe("test_publishable_pub")
    expect(saved).not.toHaveProperty("test_secret_key")
    expect(saved).not.toHaveProperty("live_secret_key")

    const storedSecret = createMercflowPaymentProviderConfigs.mock.calls[0]?.[0]
      ?.test_secret_key as string
    expect(storedSecret).not.toBe("test_secret_value")
    expect(encryption.decrypt(storedSecret)).toBe("test_secret_value")
  })

  it("getActiveProvider decrypts credentials and returns StripePaymentProvider", async (): Promise<void> => {
    const encryption = new EncryptionService({ keyHex: TEST_KEY })
    const encrypted = encryption.encrypt("test_active_secret")
    const listMercflowPaymentProviderConfigs = vi.fn().mockResolvedValue([
      {
        id: "ppc_1",
        store_id: STORE_A,
        provider: "stripe",
        mode: "test",
        test_secret_key: encrypted,
        test_publishable_key: "test_publishable_pub",
        test_webhook_secret: "test_webhook_secret",
        live_secret_key: null,
        live_publishable_key: null,
        live_webhook_secret: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ])
    const svc = createServiceStub({ listMercflowPaymentProviderConfigs })
    svc.setEncryptionService(encryption)

    const provider = await svc.getActiveProvider(STORE_A)
    expect(provider.providerKey).toBe("stripe")
    expect(provider).toBeInstanceOf(StripePaymentProvider)
  })

  it("setMode updates mode field", async (): Promise<void> => {
    const updateMercflowPaymentProviderConfigs = vi.fn().mockResolvedValue([
      {
        id: "ppc_1",
        store_id: STORE_A,
        provider: "stripe",
        mode: "live",
        test_publishable_key: "pk_test",
        live_publishable_key: "pk_live",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ])
    const listMercflowPaymentProviderConfigs = vi.fn().mockResolvedValue([
      {
        id: "ppc_1",
        store_id: STORE_A,
        provider: "stripe",
        mode: "test",
        test_publishable_key: "pk_test",
        live_publishable_key: "pk_live",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ])
    const svc = createServiceStub({
      updateMercflowPaymentProviderConfigs,
      listMercflowPaymentProviderConfigs,
    })

    const updated = await svc.setMode(STORE_A, "live")
    expect(updated.mode).toBe("live")
    expect(updated.publishable_key).toBe("pk_live")
  })

  it("getWebhookSecret returns mode-scoped webhook secret", async (): Promise<void> => {
    const listMercflowPaymentProviderConfigs = vi.fn().mockResolvedValue([
      {
        id: "ppc_1",
        store_id: STORE_A,
        provider: "stripe",
        mode: "test",
        test_webhook_secret: "whsec_test",
        live_webhook_secret: "whsec_live",
        test_secret_key: "enc",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ])
    const svc = createServiceStub({ listMercflowPaymentProviderConfigs })

    const secret = await svc.getWebhookSecret(STORE_A)
    expect(secret).toBe("whsec_test")
  })
})

describe("resolvePublishableKey", (): void => {
  it("selects test or live publishable key by mode", (): void => {
    const row = {
      test_publishable_key: "pk_test",
      live_publishable_key: "pk_live",
    }
    expect(resolvePublishableKey(row, "test")).toBe("pk_test")
    expect(resolvePublishableKey(row, "live")).toBe("pk_live")
  })
})

describe("StripePaymentProvider", (): void => {
  it("throws PaymentNotImplementedError for checkout methods", async (): Promise<void> => {
    const provider = new StripePaymentProvider({
      credentials: {
        secretKey: "test_stripe_secret",
        publishableKey: "test_publishable_pub",
        webhookSecret: null,
        mode: "test",
      },
      stripeClient: {} as never,
    })

    await expect(
      provider.createCheckoutSession({
        amount: 100,
        currency: "dkk",
        customerId: "cus_1",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      })
    ).rejects.toBeInstanceOf(PaymentNotImplementedError)
  })

  it("chargeSubscription delegates to Stripe paymentIntents.create", async (): Promise<void> => {
    const create = vi.fn().mockResolvedValue({ id: "pi_1", status: "succeeded" })
    const provider = new StripePaymentProvider({
      credentials: {
        secretKey: "test_stripe_secret",
        publishableKey: null,
        webhookSecret: null,
        mode: "test",
      },
      stripeClient: { paymentIntents: { create } } as never,
    })

    const result = await provider.chargeSubscription({
      customerId: "cus_1",
      amount: 9900,
      currency: "dkk",
      idempotencyKey: "sub_sub1_2026-06-13",
    })

    expect(result.paymentIntentId).toBe("pi_1")
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 9900,
        currency: "dkk",
        customer: "cus_1",
        confirm: true,
        off_session: true,
      }),
      expect.objectContaining({
        idempotencyKey: "sub_sub1_2026-06-13",
      })
    )
  })
})

describe("toPublicConfigRecord", (): void => {
  it("throws for invalid provider", (): void => {
    expect(() =>
      toPublicConfigRecord(
        {
          id: "ppc_1",
          store_id: STORE_A,
          provider: "invalid",
          mode: "test",
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        },
        null
      )
    ).toThrow(MedusaError)
  })
})

describe("resolveEncryptedSecretKey", (): void => {
  it("selects encrypted secret by mode", (): void => {
    const row = {
      test_secret_key: "enc_test",
      live_secret_key: "enc_live",
    }
    expect(resolveEncryptedSecretKey(row, "test")).toBe("enc_test")
    expect(resolveEncryptedSecretKey(row, "live")).toBe("enc_live")
  })
})
