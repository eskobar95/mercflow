import {
  batchPriceListPricesWorkflow,
  createCustomerGroupsWorkflow,
  createPriceListsWorkflow,
} from "@medusajs/medusa/core-flows"
import type { MedusaContainer } from "@medusajs/framework/types"
import { refetchEntity } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  PriceListStatus,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

import {
  CLUB_MEMBERS_GROUP_METADATA_KEY,
  CLUB_MEMBERS_GROUP_METADATA_VALUE,
  CLUB_MEMBERS_GROUP_NAME,
  CLUB_MEMBERS_PRICE_LIST_TITLE,
} from "./club-constants"
import type SubscriptionModuleService from "./service"
import type { SubscriptionConfigRecord } from "./types"

export type ClubMemberPriceEntry = {
  variant_id: string
  amount: number
  currency_code: string
}

export type ProductClubPricingResponse = {
  club_enabled: boolean
  prices: ClubMemberPriceEntry[]
}

type PriceListRuleWire = {
  attribute?: string | null
  value?: string[] | null
}

type PriceListWire = {
  id: string
  title?: string | null
  price_list_rules?: PriceListRuleWire[] | null
}

type PriceWire = {
  id: string
  amount?: number | null
  currency_code?: string | null
  price_set?: {
    variant?: { id?: string | null } | null
  } | null
}

type CustomerGroupWire = {
  id: string
  name?: string | null
  metadata?: Record<string, unknown> | null
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
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const groups = await remoteQuery(
    remoteQueryObjectFromString({
      entryPoint: "customer_group",
      variables: {
        filters: {},
      },
      fields: ["id", "name", "metadata"],
    })
  )
  return Array.isArray(groups) ? (groups as CustomerGroupWire[]) : []
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

function priceListMatchesCustomerGroup(
  priceList: PriceListWire,
  customerGroupId: string
): boolean {
  const rules = priceList.price_list_rules
  if (!Array.isArray(rules)) {
    return false
  }
  for (const rule of rules) {
    if (rule.attribute === "customer_group_id" && Array.isArray(rule.value)) {
      if (rule.value.includes(customerGroupId)) {
        return true
      }
    }
  }
  return false
}

async function listPriceLists(scope: MedusaContainer): Promise<PriceListWire[]> {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const lists = await remoteQuery(
    remoteQueryObjectFromString({
      entryPoint: "price_list",
      variables: {
        filters: {},
      },
      fields: ["id", "title", "price_list_rules.attribute", "price_list_rules.value"],
    })
  )
  return Array.isArray(lists) ? (lists as PriceListWire[]) : []
}

export async function ensureClubMembersPriceList(
  scope: MedusaContainer,
  customerGroupId: string
): Promise<string> {
  const lists = await listPriceLists(scope)
  const existing = lists.find((list) => priceListMatchesCustomerGroup(list, customerGroupId))
  if (existing !== undefined) {
    return existing.id
  }

  const workflow = createPriceListsWorkflow(scope)
  const { result } = await workflow.run({
    input: {
      price_lists_data: [
        {
          title: CLUB_MEMBERS_PRICE_LIST_TITLE,
          description: "MercFlow Customer Club per-product member prices",
          status: PriceListStatus.ACTIVE,
          rules: {
            customer_group_id: [customerGroupId],
          },
          prices: [],
        },
      ],
    },
  })

  const createdId = result[0]?.id
  if (typeof createdId !== "string" || createdId.trim() === "") {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Failed to create club_members price list"
    )
  }

  return createdId
}

async function assertVariantBelongsToProduct(
  scope: MedusaContainer,
  productId: string,
  variantId: string
): Promise<void> {
  const variant = await refetchEntity({
    entity: "product_variant",
    idOrFilter: variantId,
    scope,
    fields: ["id", "product_id"],
  })

  if (!variant || typeof variant !== "object") {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Variant "${variantId}" not found`
    )
  }

  const productRef = (variant as { product_id?: string | null }).product_id
  if (productRef !== productId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Variant "${variantId}" does not belong to product "${productId}"`
    )
  }
}

async function listVariantIdsForProduct(
  scope: MedusaContainer,
  productId: string
): Promise<string[]> {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const variants = await remoteQuery(
    remoteQueryObjectFromString({
      entryPoint: "variants",
      variables: {
        filters: { product_id: productId },
      },
      fields: ["id"],
    })
  )

  if (!Array.isArray(variants)) {
    return []
  }

  return variants
    .map((row) => (row as { id?: string }).id)
    .filter((id): id is string => typeof id === "string" && id.trim() !== "")
}

async function findClubPriceForVariant(
  scope: MedusaContainer,
  priceListId: string,
  variantId: string
): Promise<PriceWire | null> {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const prices = await remoteQuery(
    remoteQueryObjectFromString({
      entryPoint: "prices",
      variables: {
        filters: {
          price_list_id: priceListId,
        },
      },
      fields: [
        "id",
        "amount",
        "currency_code",
        "price_set.variant.id",
      ],
    })
  )

  if (!Array.isArray(prices)) {
    return null
  }

  for (const candidate of prices as PriceWire[]) {
    const linkedVariantId = candidate.price_set?.variant?.id
    if (linkedVariantId === variantId) {
      return candidate
    }
  }

  return null
}

export async function requireClubEnabled(
  service: SubscriptionModuleService,
  storeId: string
): Promise<SubscriptionConfigRecord> {
  const config = await service.getSubscriptionConfig(storeId)
  if (config === null) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Customer Club is not configured for this store"
    )
  }
  if (!config.club_enabled) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Customer Club is not enabled for this store"
    )
  }
  return config
}

export async function getProductClubPricing(
  scope: MedusaContainer,
  service: SubscriptionModuleService,
  storeId: string,
  productId: string
): Promise<ProductClubPricingResponse> {
  const config = await service.getSubscriptionConfig(storeId)
  if (config === null || !config.club_enabled) {
    return { club_enabled: false, prices: [] }
  }

  const product = await refetchEntity({
    entity: "product",
    idOrFilter: productId,
    scope,
    fields: ["id"],
  })
  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id "${productId}" not found`
    )
  }

  const customerGroupId = await ensureClubMembersCustomerGroup(scope)
  const priceListId = await ensureClubMembersPriceList(scope, customerGroupId)
  const variantIds = await listVariantIdsForProduct(scope, productId)

  const prices: ClubMemberPriceEntry[] = []
  for (const variantId of variantIds) {
    const existing = await findClubPriceForVariant(scope, priceListId, variantId)
    if (
      existing !== null &&
      typeof existing.amount === "number" &&
      typeof existing.currency_code === "string"
    ) {
      prices.push({
        variant_id: variantId,
        amount: existing.amount,
        currency_code: existing.currency_code,
      })
    }
  }

  return { club_enabled: true, prices }
}

export async function upsertClubMemberPrice(
  scope: MedusaContainer,
  service: SubscriptionModuleService,
  storeId: string,
  productId: string,
  input: ClubMemberPriceEntry
): Promise<ClubMemberPriceEntry> {
  await requireClubEnabled(service, storeId)

  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "amount must be a non-negative number (minor currency units)"
    )
  }

  const currency = input.currency_code.trim().toLowerCase()
  if (currency === "") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "currency_code is required")
  }

  await assertVariantBelongsToProduct(scope, productId, input.variant_id)

  const customerGroupId = await ensureClubMembersCustomerGroup(scope)
  const priceListId = await ensureClubMembersPriceList(scope, customerGroupId)
  const existing = await findClubPriceForVariant(scope, priceListId, input.variant_id)

  const workflow = batchPriceListPricesWorkflow(scope)

  if (existing !== null && typeof existing.id === "string") {
    await workflow.run({
      input: {
        data: {
          id: priceListId,
          create: [],
          update: [
            {
              id: existing.id,
              variant_id: input.variant_id,
              amount: input.amount,
              currency_code: currency,
            },
          ],
          delete: [],
        },
      },
    })
  } else {
    await workflow.run({
      input: {
        data: {
          id: priceListId,
          create: [
            {
              variant_id: input.variant_id,
              amount: input.amount,
              currency_code: currency,
            },
          ],
          update: [],
          delete: [],
        },
      },
    })
  }

  return {
    variant_id: input.variant_id,
    amount: input.amount,
    currency_code: currency,
  }
}

export async function deleteClubMemberPrice(
  scope: MedusaContainer,
  service: SubscriptionModuleService,
  storeId: string,
  productId: string,
  variantId: string
): Promise<void> {
  await requireClubEnabled(service, storeId)
  await assertVariantBelongsToProduct(scope, productId, variantId)

  const customerGroupId = await ensureClubMembersCustomerGroup(scope)
  const priceListId = await ensureClubMembersPriceList(scope, customerGroupId)
  const existing = await findClubPriceForVariant(scope, priceListId, variantId)

  if (existing === null || typeof existing.id !== "string") {
    return
  }

  const workflow = batchPriceListPricesWorkflow(scope)
  await workflow.run({
    input: {
      data: {
        id: priceListId,
        create: [],
        update: [],
        delete: [existing.id],
      },
    },
  })
}
