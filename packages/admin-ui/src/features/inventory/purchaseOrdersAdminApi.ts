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

import type {
  CreatePurchaseOrderInput,
  PurchaseOrderDetailDto,
  PurchaseOrderDto,
  PurchaseOrderLineDto,
  ReceivePurchaseOrderLineInput,
} from "./types"

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

function parsePurchaseOrderLine(raw: unknown): PurchaseOrderLineDto | null {
  if (!isRecord(raw)) {
    return null
  }
  if (
    typeof raw.id !== "string" ||
    typeof raw.store_id !== "string" ||
    typeof raw.po_id !== "string" ||
    typeof raw.variant_id !== "string" ||
    typeof raw.ordered_qty !== "number" ||
    typeof raw.unit_cost !== "number" ||
    typeof raw.created_at !== "string" ||
    typeof raw.updated_at !== "string"
  ) {
    return null
  }
  return {
    id: raw.id,
    store_id: raw.store_id,
    po_id: raw.po_id,
    variant_id: raw.variant_id,
    ordered_qty: raw.ordered_qty,
    unit_cost: raw.unit_cost,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    received_total: typeof raw.received_total === "number" ? raw.received_total : undefined,
    discrepancy: typeof raw.discrepancy === "number" ? raw.discrepancy : undefined,
  }
}

function parsePurchaseOrderDetail(raw: unknown): PurchaseOrderDetailDto | null {
  if (!isRecord(raw)) {
    return null
  }
  const po = parsePurchaseOrder(raw.purchase_order)
  if (!po || !Array.isArray(raw.lines) || typeof raw.stock_applied !== "boolean") {
    return null
  }
  const lines: PurchaseOrderLineDto[] = []
  for (const line of raw.lines) {
    const parsed = parsePurchaseOrderLine(line)
    if (parsed) {
      lines.push(parsed)
    }
  }
  return {
    purchase_order: po,
    lines,
    stock_applied: raw.stock_applied,
  }
}

function parsePurchaseOrder(raw: unknown): PurchaseOrderDto | null {
  if (!isRecord(raw)) {
    return null
  }
  if (
    typeof raw.id !== "string" ||
    typeof raw.store_id !== "string" ||
    typeof raw.supplier_id !== "string" ||
    typeof raw.status !== "string" ||
    typeof raw.created_at !== "string" ||
    typeof raw.updated_at !== "string"
  ) {
    return null
  }
  const expected =
    raw.expected_date === null || typeof raw.expected_date === "string"
      ? (raw.expected_date as string | null)
      : null
  return {
    id: raw.id,
    store_id: raw.store_id,
    supplier_id: raw.supplier_id,
    status: raw.status,
    expected_date: expected,
    reference:
      raw.reference === null || typeof raw.reference === "string"
        ? (raw.reference as string | null)
        : null,
    notes:
      raw.notes === null || typeof raw.notes === "string"
        ? (raw.notes as string | null)
        : null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

export async function listPurchaseOrdersAdmin(): Promise<PurchaseOrderDto[]> {
  const res = await fetch(buildUrl("/admin/purchase-orders"), {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
  const json = await parseMedusaAdminJsonResponse(res)
  if (!isRecord(json) || !Array.isArray(json.purchase_orders)) {
    throw new Error("Invalid purchase orders response")
  }
  const out: PurchaseOrderDto[] = []
  for (const row of json.purchase_orders) {
    const parsed = parsePurchaseOrder(row)
    if (parsed) {
      out.push(parsed)
    }
  }
  return out
}

export async function createPurchaseOrderAdmin(
  input: CreatePurchaseOrderInput
): Promise<PurchaseOrderDto> {
  const res = await fetch(buildUrl("/admin/purchase-orders"), {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
  const json = await parseMedusaAdminJsonResponse(res)
  if (!isRecord(json)) {
    throw new Error("Invalid create purchase order response")
  }
  const parsed = parsePurchaseOrder(json.purchase_order)
  if (!parsed) {
    throw new Error("Invalid purchase order payload")
  }
  return parsed
}

export async function getPurchaseOrderAdmin(id: string): Promise<PurchaseOrderDetailDto> {
  const res = await fetch(buildUrl(`/admin/purchase-orders/${encodeURIComponent(id)}`), {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
  const json = await parseMedusaAdminJsonResponse(res)
  const parsed = parsePurchaseOrderDetail(json)
  if (!parsed) {
    throw new Error("Invalid purchase order detail response")
  }
  return parsed
}

export async function receivePurchaseOrderAdmin(
  id: string,
  lines: ReceivePurchaseOrderLineInput[]
): Promise<PurchaseOrderDetailDto> {
  const res = await fetch(
    buildUrl(`/admin/purchase-orders/${encodeURIComponent(id)}/receive`),
    {
      method: "POST",
      headers: buildMedusaAdminJsonHeaders(),
      credentials: "include",
      body: JSON.stringify({ lines }),
    }
  )
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
  const json = await parseMedusaAdminJsonResponse(res)
  const parsed = parsePurchaseOrderDetail(json)
  if (!parsed) {
    throw new Error("Invalid receive purchase order response")
  }
  return parsed
}

export async function updatePurchaseOrderStatusAdmin(
  id: string,
  status: string
): Promise<PurchaseOrderDto> {
  const res = await fetch(
    buildUrl(`/admin/purchase-orders/${encodeURIComponent(id)}/status`),
    {
      method: "PATCH",
      headers: buildMedusaAdminJsonHeaders(),
      credentials: "include",
      body: JSON.stringify({ status }),
    }
  )
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
  const json = await parseMedusaAdminJsonResponse(res)
  if (!isRecord(json)) {
    throw new Error("Invalid status update response")
  }
  const parsed = parsePurchaseOrder(json.purchase_order)
  if (!parsed) {
    throw new Error("Invalid purchase order payload")
  }
  return parsed
}
