import {
  convertDraftOrderWorkflow,
  createOrderWorkflow,
} from "@medusajs/core-flows"
import type { MedusaContainer } from "@medusajs/framework"
import type { AdditionalData, CreateOrderDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, OrderStatus } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import type { ChargeableSubscription, RenewalOrderDraft } from "./charge-subscription"

type VariantPricingRow = {
  id: string
  calculated_price?: {
    calculated_amount?: number | null
    currency_code?: string | null
  } | null
}

type CustomerRow = {
  id: string
  email?: string | null
}

type RegionRow = {
  id: string
  currency_code: string
}

export async function createRenewalOrderDraft(
  container: MedusaContainer,
  storeId: string,
  subscription: ChargeableSubscription
): Promise<RenewalOrderDraft> {
  const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY) as {
    graph: (input: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{ data: unknown[] }>
  }

  const variantResult = await remoteQuery.graph({
    entity: "variant",
    fields: [
      "id",
      "calculated_price.calculated_amount",
      "calculated_price.currency_code",
    ],
    filters: { id: subscription.variant_id },
  })

  const variant = variantResult.data[0] as VariantPricingRow | undefined
  if (variant === undefined) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Variant "${subscription.variant_id}" not found for subscription renewal`
    )
  }

  const amount = variant.calculated_price?.calculated_amount
  const currency = variant.calculated_price?.currency_code
  if (amount === undefined || amount === null || currency === undefined || currency === null) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Variant "${subscription.variant_id}" has no calculated price for renewal`
    )
  }

  const regionResult = await remoteQuery.graph({
    entity: "region",
    fields: ["id", "currency_code"],
    filters: { currency_code: currency },
  })
  const region = regionResult.data[0] as RegionRow | undefined
  if (region === undefined) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No region found for currency "${currency}"`
    )
  }

  const customerResult = await remoteQuery.graph({
    entity: "customer",
    fields: ["id", "email"],
    filters: { id: subscription.customer_id },
  })
  const customer = customerResult.data[0] as CustomerRow | undefined
  if (customer === undefined) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer "${subscription.customer_id}" not found for subscription renewal`
    )
  }

  const workflowInput = {
    region_id: region.id,
    customer_id: subscription.customer_id,
    email: customer.email ?? undefined,
    currency_code: currency,
    status: OrderStatus.DRAFT,
    is_draft_order: true,
    no_notification: true,
    items: [
      {
        variant_id: subscription.variant_id,
        quantity: 1,
        title: "Subscription renewal",
        unit_price: amount,
      },
    ],
    metadata: {
      mercflow_subscription_id: subscription.id,
      mercflow_store_id: storeId,
      mercflow_renewal: true,
    },
  } as CreateOrderDTO & AdditionalData

  const { result: draftOrder } = await createOrderWorkflow(container).run({
    input: workflowInput,
  })

  await convertDraftOrderWorkflow(container).run({
    input: { id: draftOrder.id },
  })

  return {
    orderId: draftOrder.id,
    amount,
    currency,
  }
}
