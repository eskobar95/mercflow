import type { MedusaRequest } from "@medusajs/framework/http"
import type { WebhookEvent } from "@mercflow/payment-module/types"

import { handleClubMembershipStripeEvent } from "@mercflow/subscription-module/club-membership-handler"
import { SUBSCRIPTION_MODULE } from "@mercflow/subscription-module"
import type { SubscriptionModuleService } from "@mercflow/subscription-module"

import { createStripeWebhookPost } from "@mercflow/payment-module/mercflow-stripe-webhook-route"

export const POST = createStripeWebhookPost({
  handleEvent: async (req: MedusaRequest, event: WebhookEvent, storeId: string) => {
    const service = req.scope.resolve(SUBSCRIPTION_MODULE) as SubscriptionModuleService
    const config = await service.getOrCreateSubscriptionConfig(storeId)
    const result = await handleClubMembershipStripeEvent(req.scope, event, config)
    return {
      action: result.action,
      customer_id: result.customer_id ?? null,
    }
  },
})
