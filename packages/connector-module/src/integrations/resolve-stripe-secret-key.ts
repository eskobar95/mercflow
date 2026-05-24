import type { MedusaContainer } from "@medusajs/framework/types"

import { CONNECTOR_MODULE } from "../modules/connector/index"
import type ConnectorModuleService from "../modules/connector/service"

/**
 * Prefer `STRIPE_API_KEY` / `STRIPE_SECRET_KEY`; otherwise resolves the decrypted secret from the Stripe connector row.
 *
 * Intended for Medusa Stripe payment modules (e.g. Guapo-specific providers) wired at bootstrap.
 */
export async function mercflowResolveStripeSecretKey(
  scope: MedusaContainer
): Promise<string | null> {
  const svc = scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  return svc.resolveStripeSecretKeyOrNull()
}
