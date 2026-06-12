import type { MedusaContainer } from "@medusajs/framework/types"

import { CONNECTOR_MODULE } from "../modules/connector/index"
import type ConnectorModuleService from "../modules/connector/service"

/**
 * Prefer `STRIPE_WEBHOOK_SECRET`; otherwise resolves the webhook secret from the Stripe connector row.
 */
export async function mercflowResolveStripeWebhookSecret(
  scope: MedusaContainer
): Promise<string | null> {
  const svc = scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  return svc.resolveStripeWebhookSecretOrNull()
}
