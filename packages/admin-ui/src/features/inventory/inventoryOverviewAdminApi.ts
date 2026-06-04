import {
  appendMercflowStoreQuery,
  resolveMercflowStoreIdForAdmin,
} from "@/features/orders/resolveMercflowStoreId"
import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

export type InventoryOverviewRowDto = {
  variant_id: string
  sku: string | null
  title: string
  stocked: number
  reserved: number
  available: number
  incoming: number
  is_low_stock: boolean
}

export type InventoryMovementDto = {
  id: string
  occurred_at: string
  quantity: number
  source: "po_receipt" | "sale" | "manual_adjustment"
  label: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function requireBackendBase(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  return base
}

function buildUrl(path: string): string {
  const base = requireBackendBase()
  const storeId = resolveMercflowStoreIdForAdmin()
  return appendMercflowStoreQuery(`${base}${path}`, storeId)
}

export type InventoryOverviewSortColumn =
  | "title"
  | "stocked"
  | "reserved"
  | "available"
  | "incoming"

export type InventoryOverviewSortDirection = "asc" | "desc"

export async function listInventoryOverviewAdmin(params: {
  page: number
  limit: number
  search: string
  filter: "all" | "low_stock"
  sortBy: InventoryOverviewSortColumn
  sortDir: InventoryOverviewSortDirection
}): Promise<{
  rows: InventoryOverviewRowDto[]
  count: number
  low_stock_threshold: number
}> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    filter: params.filter,
    sort_by: params.sortBy,
    sort_dir: params.sortDir,
  })
  if (params.search.trim() !== "") {
    query.set("search", params.search.trim())
  }

  const res = await fetch(buildUrl(`/admin/inventory-overview?${query.toString()}`), {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
  const json = await parseMedusaAdminJsonResponse(res)
  if (!isRecord(json) || !Array.isArray(json.rows) || typeof json.count !== "number") {
    throw new Error("Invalid inventory overview response")
  }

  const rows: InventoryOverviewRowDto[] = []
  for (const raw of json.rows) {
    if (!isRecord(raw) || typeof raw.variant_id !== "string") {
      continue
    }
    rows.push({
      variant_id: raw.variant_id,
      sku: typeof raw.sku === "string" ? raw.sku : null,
      title: typeof raw.title === "string" ? raw.title : raw.variant_id,
      stocked: typeof raw.stocked === "number" ? raw.stocked : 0,
      reserved: typeof raw.reserved === "number" ? raw.reserved : 0,
      available: typeof raw.available === "number" ? raw.available : 0,
      incoming: typeof raw.incoming === "number" ? raw.incoming : 0,
      is_low_stock: Boolean(raw.is_low_stock),
    })
  }

  return {
    rows,
    count: json.count,
    low_stock_threshold:
      typeof json.low_stock_threshold === "number" ? json.low_stock_threshold : 5,
  }
}

export async function listVariantMovementsAdmin(
  variantId: string
): Promise<InventoryMovementDto[]> {
  const res = await fetch(
    buildUrl(
      `/admin/inventory-overview/${encodeURIComponent(variantId)}/movements`
    ),
    {
      method: "GET",
      headers: buildMedusaAdminJsonHeaders(),
      credentials: "include",
    }
  )
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
  const json = await parseMedusaAdminJsonResponse(res)
  if (!isRecord(json) || !Array.isArray(json.movements)) {
    throw new Error("Invalid movements response")
  }

  const out: InventoryMovementDto[] = []
  for (const raw of json.movements) {
    if (
      !isRecord(raw) ||
      typeof raw.id !== "string" ||
      typeof raw.occurred_at !== "string" ||
      typeof raw.quantity !== "number" ||
      typeof raw.source !== "string" ||
      typeof raw.label !== "string"
    ) {
      continue
    }
    if (
      raw.source !== "po_receipt" &&
      raw.source !== "sale" &&
      raw.source !== "manual_adjustment"
    ) {
      continue
    }
    out.push({
      id: raw.id,
      occurred_at: raw.occurred_at,
      quantity: raw.quantity,
      source: raw.source,
      label: raw.label,
    })
  }
  return out
}

export async function patchInventoryConfigAdmin(input: {
  low_stock_threshold: number
}): Promise<number> {
  const res = await fetch(buildUrl("/admin/inventory-config"), {
    method: "PATCH",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
  const json = await parseMedusaAdminJsonResponse(res)
  if (!isRecord(json) || !isRecord(json.config)) {
    throw new Error("Invalid inventory config response")
  }
  const threshold = json.config.low_stock_threshold
  return typeof threshold === "number" ? threshold : input.low_stock_threshold
}
