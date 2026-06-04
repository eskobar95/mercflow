import type { MedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import { assertMedusaStoreId } from "../../modules/seo/tenant-scope"

type PublishableKeyContext = {
  sales_channel_ids: string[]
}

type RemoteQueryClient = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data?: unknown }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readPublishableContext(req: MedusaRequest): PublishableKeyContext | null {
  const ctx = (req as MedusaRequest & { publishable_key_context?: PublishableKeyContext })
    .publishable_key_context
  if (!ctx || !Array.isArray(ctx.sales_channel_ids) || ctx.sales_channel_ids.length === 0) {
    return null
  }
  return ctx
}

/**
 * Resolves tenant `store_id` from Medusa publishable API key context (sales channels → store).
 */
export async function resolveStoreIdFromPublishableKey(
  req: MedusaRequest
): Promise<string | null> {
  const ctx = readPublishableContext(req)
  if (!ctx) {
    return null
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as RemoteQueryClient
  const page = await query.graph({
    entity: "sales_channel",
    fields: ["store.id"],
    filters: {
      id: ctx.sales_channel_ids,
    },
  })

  const rows = Array.isArray(page.data) ? page.data : []
  const storeIds = new Set<string>()
  for (const row of rows) {
    if (!isRecord(row)) {
      continue
    }
    const store = row.store
    if (isRecord(store) && typeof store.id === "string" && store.id.length > 0) {
      storeIds.add(store.id)
    }
  }

  if (storeIds.size === 0) {
    return null
  }
  if (storeIds.size > 1) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Publishable API key is linked to multiple stores"
    )
  }

  const storeId = [...storeIds][0]!
  assertMedusaStoreId(storeId)
  return storeId
}
