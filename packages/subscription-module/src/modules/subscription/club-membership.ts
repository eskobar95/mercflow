import { createCustomerGroupsWorkflow } from "@medusajs/medusa/core-flows"
import type { MedusaContainer } from "@medusajs/framework/types"
import type { ICustomerModuleService } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import type { WebhookEvent } from "@mercflow/payment-module/types"

import {
  CLUB_MEMBERS_GROUP_METADATA_KEY,
  CLUB_MEMBERS_GROUP_METADATA_VALUE,
  CLUB_MEMBERS_GROUP_NAME,
} from "./club-constants"
import {
  parseClubMembershipWebhookEvent,
  type ClubMembershipSubscriptionPayload,
} from "./club-webhook-types"
import type { SubscriptionConfigRecord } from "./types"

type CustomerGroupWire = {
  id: string
  name?: string | null
  metadata?: Record<string, unknown> | null
}

type AccountHolderWire = {
  customer_id?: string | null
  provider_id?: string | null
  data?: Record<string, unknown> | null
}

function isClubMembersGroup(group: CustomerGroupWire): boolean {
  const metadata = group.metadata
  if (
    metadata !== null &&
    metadata !== undefined &&
    metadata[CLUB_MEMBERS_GROUP_METADATA_KEY] === CLUB_MEMBERS_GROUP_METADATA_VALUE
  ) {
    return true
  }
  return group.name === CLUB_MEMBERS_GROUP_NAME
}

async function listCustomerGroups(scope: MedusaContainer): Promise<CustomerGroupWire[]> {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY) as {
    graph: (input: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{ data: unknown[] }>
  }

  const result = await remoteQuery.graph({
    entity: "customer_group",
    fields: ["id", "name", "metadata"],
    filters: {},
  })

  return Array.isArray(result.data) ? (result.data as CustomerGroupWire[]) : []
}

export async function ensureClubMembersCustomerGroup(
  scope: MedusaContainer
): Promise<string> {
  const groups = await listCustomerGroups(scope)
  const existing = groups.find(isClubMembersGroup)
  if (existing !== undefined) {
    return existing.id
  }

  const workflow = createCustomerGroupsWorkflow(scope)
  const { result } = await workflow.run({
    input: {
      customersData: [
        {
          name: CLUB_MEMBERS_GROUP_NAME,
          metadata: {
            [CLUB_MEMBERS_GROUP_METADATA_KEY]: CLUB_MEMBERS_GROUP_METADATA_VALUE,
          },
        },
      ],
    },
  })

  const createdId = result[0]?.id
  if (typeof createdId !== "string" || createdId.trim() === "") {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Failed to create club_members customer group"
    )
  }

  return createdId
}

export async function resolveMedusaCustomerIdFromStripeCustomer(
  scope: MedusaContainer,
  stripeCustomerId: string
): Promise<string | null> {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY) as {
    graph: (input: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{ data: unknown[] }>
  }

  const result = await remoteQuery.graph({
    entity: "account_holder",
    fields: ["customer_id", "provider_id", "data"],
    filters: {
      provider_id: "pp_stripe_stripe",
    },
  })

  const rows = Array.isArray(result.data) ? (result.data as AccountHolderWire[]) : []
  for (const row of rows) {
    const dataId = row.data?.id
    if (typeof dataId === "string" && dataId === stripeCustomerId) {
      const customerId = row.customer_id
      if (typeof customerId === "string" && customerId.trim() !== "") {
        return customerId
      }
    }
  }

  return null
}

function resolveStripeProductId(subscription: ClubMembershipSubscriptionPayload): string | null {
  const item = subscription.items.data[0]
  if (item === undefined) {
    return null
  }
  const product = item.price?.product
  if (typeof product === "string") {
    return product
  }
  if (product !== null && typeof product === "object" && "id" in product) {
    const id = (product as { id?: unknown }).id
    return typeof id === "string" ? id : null
  }
  return null
}

function isClubMembershipSubscription(
  subscription: ClubMembershipSubscriptionPayload,
  config: SubscriptionConfigRecord
): boolean {
  const clubProductId = config.club_stripe_product_id
  if (clubProductId === null || clubProductId.trim() === "") {
    return false
  }
  const productId = resolveStripeProductId(subscription)
  return productId === clubProductId
}

export async function isCustomerInClubMembersGroup(
  scope: MedusaContainer,
  customerId: string,
  groupId: string
): Promise<boolean> {
  const customerModule = scope.resolve(Modules.CUSTOMER) as ICustomerModuleService
  const rels = await customerModule.listCustomerGroupCustomers({
    customer_id: customerId,
    customer_group_id: groupId,
  })
  return rels.length > 0
}

export async function addCustomerToClubMembersGroup(
  scope: MedusaContainer,
  customerId: string,
  groupId: string
): Promise<boolean> {
  const alreadyMember = await isCustomerInClubMembersGroup(scope, customerId, groupId)
  if (alreadyMember) {
    return false
  }

  const customerModule = scope.resolve(Modules.CUSTOMER) as ICustomerModuleService
  await customerModule.addCustomerToGroup({
    customer_id: customerId,
    customer_group_id: groupId,
  })
  return true
}

export async function removeCustomerFromClubMembersGroup(
  scope: MedusaContainer,
  customerId: string,
  groupId: string
): Promise<void> {
  const customerModule = scope.resolve(Modules.CUSTOMER) as ICustomerModuleService
  await customerModule.removeCustomerFromGroup({
    customer_id: customerId,
    customer_group_id: groupId,
  })
}

export type ClubMembershipWebhookResult = {
  handled: boolean
  action: "added" | "removed" | "skipped" | "ignored"
  customer_id?: string
}

export async function handleClubMembershipStripeEvent(
  scope: MedusaContainer,
  event: WebhookEvent,
  config: SubscriptionConfigRecord
): Promise<ClubMembershipWebhookResult> {
  if (!config.club_enabled) {
    return { handled: true, action: "ignored" }
  }

  if (event.type !== "customer.subscription.created" && event.type !== "customer.subscription.deleted") {
    return { handled: false, action: "ignored" }
  }

  const parsed = parseClubMembershipWebhookEvent(event)
  const subscription = parsed.data.object
  if (!isClubMembershipSubscription(subscription, config)) {
    return { handled: true, action: "ignored" }
  }

  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer !== null &&
          typeof subscription.customer === "object" &&
          "id" in subscription.customer
        ? String((subscription.customer as { id: string }).id)
        : null

  if (stripeCustomerId === null || stripeCustomerId.trim() === "") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Stripe subscription event is missing customer id"
    )
  }

  const medusaCustomerId = await resolveMedusaCustomerIdFromStripeCustomer(
    scope,
    stripeCustomerId
  )

  if (medusaCustomerId === null) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No Medusa customer found for Stripe customer "${stripeCustomerId}"`
    )
  }

  const groupId = await ensureClubMembersCustomerGroup(scope)

  if (event.type === "customer.subscription.created") {
    const added = await addCustomerToClubMembersGroup(scope, medusaCustomerId, groupId)
    return {
      handled: true,
      action: added ? "added" : "skipped",
      customer_id: medusaCustomerId,
    }
  }

  await removeCustomerFromClubMembersGroup(scope, medusaCustomerId, groupId)
  return {
    handled: true,
    action: "removed",
    customer_id: medusaCustomerId,
  }
}
