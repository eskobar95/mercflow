import type { MedusaContainer } from "@medusajs/framework/types"
import { refetchEntity } from "@medusajs/framework/http"

import type { SubscriptionRecord } from "../../modules/subscription/types"

function buildCustomerDisplay(payload: {
  email?: string | null
  first_name?: string | null
  last_name?: string | null
}): string {
  const parts = [payload.first_name, payload.last_name].filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0
  )
  if (parts.length > 0) {
    return parts.join(" ")
  }
  if (typeof payload.email === "string" && payload.email.trim().length > 0) {
    return payload.email.trim()
  }
  return "Customer"
}

function buildVariantLabel(payload: {
  title?: string | null
  sku?: string | null
  product?: { title?: string | null } | null
}): string {
  const productTitle =
    payload.product && typeof payload.product.title === "string"
      ? payload.product.title
      : undefined
  const variantTitle =
    typeof payload.title === "string" ? payload.title : undefined
  const sku = typeof payload.sku === "string" ? payload.sku : undefined

  if (productTitle && variantTitle) {
    return `${productTitle} — ${variantTitle}`
  }
  if (productTitle) {
    return productTitle
  }
  if (variantTitle) {
    return variantTitle
  }
  if (sku) {
    return sku
  }
  return "Product variant"
}

export type SubscriptionAdminLabels = {
  customer_display: string
  product_label: string
}

/**
 * Enriches persisted subscription rows with Medusa customer + variant labels for admin tables.
 */
export async function enrichSubscriptionsForAdmin(
  scope: MedusaContainer,
  rows: SubscriptionRecord[]
): Promise<SubscriptionAdminLabels[]> {
  const customerCache = new Map<string, string>()
  const variantCache = new Map<string, string>()

  const hydrateCustomer = async (id: string): Promise<string> => {
    if (customerCache.has(id)) {
      return customerCache.get(id) as string
    }
    const customer = await refetchEntity({
      entity: "customer",
      idOrFilter: id,
      scope,
      fields: ["id", "email", "first_name", "last_name"],
    })
    if (!customer || typeof customer !== "object") {
      customerCache.set(id, "Unknown customer")
      return "Unknown customer"
    }
    const c = customer as {
      email?: string | null
      first_name?: string | null
      last_name?: string | null
    }
    const label = buildCustomerDisplay(c)
    customerCache.set(id, label)
    return label
  }

  const hydrateVariant = async (id: string): Promise<string> => {
    if (variantCache.has(id)) {
      return variantCache.get(id) as string
    }
    const variant = await refetchEntity({
      entity: "product_variant",
      idOrFilter: id,
      scope,
      fields: ["id", "title", "sku", "product.title"],
    })
    if (!variant || typeof variant !== "object") {
      variantCache.set(id, "Unknown variant")
      return "Unknown variant"
    }
    const label = buildVariantLabel(
      variant as {
        title?: string | null
        sku?: string | null
        product?: { title?: string | null } | null
      }
    )
    variantCache.set(id, label)
    return label
  }

  const out: SubscriptionAdminLabels[] = []
  for (const row of rows) {
    const customerDisplay = await hydrateCustomer(row.customer_id)
    const productLabel = await hydrateVariant(row.variant_id)
    out.push({ customer_display: customerDisplay, product_label: productLabel })
  }

  return out
}
