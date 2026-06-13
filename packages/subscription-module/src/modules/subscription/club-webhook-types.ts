import type { WebhookEvent } from "@mercflow/payment-module/types"

export type ClubMembershipSubscriptionPayload = {
  customer: string | { id: string } | null
  items: {
    data: Array<{
      price?: {
        product?: string | { id?: string } | null
      } | null
    }>
  }
}

export type ClubMembershipWebhookEvent = WebhookEvent & {
  data: {
    object: ClubMembershipSubscriptionPayload
  }
}

function isClubMembershipWebhookEvent(event: WebhookEvent): event is ClubMembershipWebhookEvent {
  if (typeof event.data !== "object" || event.data === null) {
    return false
  }
  const data = event.data as { object?: unknown }
  return typeof data.object === "object" && data.object !== null
}

export function parseClubMembershipWebhookEvent(event: WebhookEvent): ClubMembershipWebhookEvent {
  if (!isClubMembershipWebhookEvent(event)) {
    throw new Error("Webhook event is missing subscription payload")
  }
  return event
}
