import { describe, expect, it, vi, afterEach } from "vitest"

import { mercflowResolveStripeWebhookSecret } from "../src/integrations/resolve-stripe-webhook-secret"
import { CONNECTOR_MODULE } from "../src/modules/connector"

describe("mercflowResolveStripeWebhookSecret", (): void => {
  afterEach((): void => {
    delete process.env.STRIPE_WEBHOOK_SECRET
  })

  it("delegates to connector service", async (): Promise<void> => {
    const resolveStripeWebhookSecretOrNull = vi.fn().mockResolvedValue("whsec_test")
    const scope = {
      resolve: (key: string): unknown => {
        if (key === CONNECTOR_MODULE) {
          return { resolveStripeWebhookSecretOrNull }
        }
        return null
      },
    }

    const secret = await mercflowResolveStripeWebhookSecret(scope as never)

    expect(secret).toBe("whsec_test")
    expect(resolveStripeWebhookSecretOrNull).toHaveBeenCalledOnce()
  })
})
