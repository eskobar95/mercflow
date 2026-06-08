import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { resolveAdminListLimit } from "../../http/admin-list-limit"
import { sendZodError } from "../../http/zod-error"
import { INVENTORY_MODULE } from "../../../modules/inventory"
import {
  buildOverviewRowsFromVariants,
  filterAndPaginateOverviewRows,
} from "../../../modules/inventory/inventory-overview-load"
import { inventoryOverviewQuerySchema } from "../../../modules/inventory/http-schemas"
import { resolveMercflowStoreId } from "../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../modules/inventory/service"

const VARIANT_PAGE_SIZE = 100

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = inventoryOverviewQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const limit = Math.min(resolveAdminListLimit(parsed.data.limit), 100)

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const config = await service.getInventoryConfig(storeId)
  const lowStockThreshold = config?.low_stock_threshold ?? 5

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (input: {
      entity: string
      fields: string[]
      pagination?: { take: number; skip: number }
    }) => Promise<{ data: unknown[] }>
  }

  const variantRows: unknown[] = []
  let skip = 0
  while (true) {
    const page = await query.graph({
      entity: "product_variant",
      fields: [
        "id",
        "sku",
        "title",
        "inventory_quantity",
        "product.title",
        "inventory_items.inventory_item_id",
        "inventory_items.inventory.location_levels.stocked_quantity",
        "inventory_items.inventory.location_levels.reserved_quantity",
      ],
      pagination: { take: VARIANT_PAGE_SIZE, skip },
    })
    const batch = Array.isArray(page.data) ? page.data : []
    if (batch.length === 0) {
      break
    }
    variantRows.push(...batch)
    skip += batch.length
    if (batch.length < VARIANT_PAGE_SIZE) {
      break
    }
  }

  const incomingByVariant = await service.listIncomingQtyByVariant(storeId)
  const built = buildOverviewRowsFromVariants({
    variantRows,
    incomingByVariant,
    lowStockThreshold,
  })

  const search = parsed.data.search ?? ""
  const paged = filterAndPaginateOverviewRows(built, {
    search,
    filter: parsed.data.filter,
    sort_by: parsed.data.sort_by,
    sort_dir: parsed.data.sort_dir,
    page: parsed.data.page,
    limit,
  })

  res.status(200).json({
    store_id: storeId,
    low_stock_threshold: lowStockThreshold,
    count: paged.count,
    page: parsed.data.page,
    limit,
    sort_by: parsed.data.sort_by,
    sort_dir: parsed.data.sort_dir,
    rows: paged.rows,
  })
}
