import type { Context } from "@medusajs/types"
import { MedusaError } from "@medusajs/utils"

import type FeedConfigService from "./service"
type SqlExecutor = {
  execute: (sql: string, params?: unknown[]) => Promise<unknown>
}

function resolveSqlExecutor(transactionManager: unknown): SqlExecutor {
  const candidate = transactionManager as SqlExecutor & {
    getConnection?: () => SqlExecutor
  }
  if (typeof candidate.execute === "function") {
    return candidate
  }
  const connection = candidate.getConnection?.()
  if (connection && typeof connection.execute === "function") {
    return connection
  }
  throw new MedusaError(
    MedusaError.Types.UNEXPECTED_STATE,
    "Cannot query brand: missing SQL executor on transaction manager"
  )
}

function firstBrandNameFromRows(result: unknown): string | null {
  if (!Array.isArray(result)) {
    return null
  }
  const row = result[0]
  if (typeof row !== "object" || row === null) {
    return null
  }
  const name = (row as Record<string, unknown>).name
  return typeof name === "string" && name.trim().length > 0 ? name.trim() : null
}

/**
 * Loads brand name via Guapo `brand` + `product_product_brand_brand` tables (tenant-scoped).
 */
export async function loadBrandNameForProduct(
  feedConfigService: FeedConfigService,
  storeId: string,
  productId: string
): Promise<string | null> {
  try {
    return await feedConfigService.withTenant(storeId, async (context: Context) => {
      const runner = resolveSqlExecutor(context.transactionManager)
      const rows = await runner.execute(
        `SELECT b.name AS name
         FROM brand b
         INNER JOIN product_product_brand_brand ppb ON ppb.brand_id = b.id
         WHERE ppb.product_id = ?
           AND b.store_id = ?
           AND (b.deleted_at IS NULL)
         LIMIT 1`,
        [productId, storeId]
      )
      return firstBrandNameFromRows(rows)
    })
  } catch {
    return null
  }
}
