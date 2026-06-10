import type { MedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

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

/**
 * Returns `categoryId` and every ancestor category id (parent chain), nearest first.
 */
export async function resolveCategoryAncestorIds(
  req: MedusaRequest,
  categoryId: string
): Promise<string[]> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as RemoteQueryClient
  const ids: string[] = []
  const seen = new Set<string>()
  let currentId: string | null = categoryId

  while (currentId !== null) {
    if (seen.has(currentId)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Product category hierarchy cycle detected at ${currentId}`
      )
    }
    seen.add(currentId)
    ids.push(currentId)

    const page = await query.graph({
      entity: "product_category",
      fields: ["id", "parent_category_id"],
      filters: { id: currentId },
    })
    const rows = Array.isArray(page.data) ? page.data : []
    const row = rows[0]
    if (!isRecord(row)) {
      break
    }
    const parentId = row.parent_category_id
    currentId = typeof parentId === "string" && parentId.length > 0 ? parentId : null
  }

  return ids
}
