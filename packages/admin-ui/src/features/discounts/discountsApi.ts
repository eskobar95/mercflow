import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import { parseDiscountsListEnvelope } from "./parseDiscountsListResponse"
import type { AdminDiscountDetail, AdminDiscountListResponse, DiscountTypeApi } from "./types"

function serializeQuery(entries: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) {
      params.set(key, String(value))
    }
  }
  const query = params.toString()
  return query.length > 0 ? `?${query}` : ""
}

function resolveBackendBase(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Medusa backend URL missing — set VITE_MEDUSA_ADMIN_BACKEND_URL in the admin-ui env.",
    )
  }
  return base
}

export type CreateDiscountApplicationMethod = {
  type: "fixed" | "percentage"
  value: number
  currency_code?: string
  target_type?: "order" | "shipping_methods" | "items"
  allocation?: "each" | "across" | "once"
  buy_rules_min_quantity?: number
  apply_to_quantity?: number
}

export type CreateDiscountPayload = {
  name: string
  discount_type: DiscountTypeApi
  method: "code" | "automatic"
  code?: string
  status?: "draft" | "active" | "inactive"
  usage_limit?: number | null
  application_method?: CreateDiscountApplicationMethod
  minimum_purchase_amount?: number
  starts_at?: string
  ends_at?: string | null
}

export type UpdateDiscountPayload = Partial<CreateDiscountPayload>

function parseDiscountDetail(raw: unknown): AdminDiscountDetail | null {
  if (typeof raw !== "object" || raw === null) {
    return null
  }
  const envelope = raw as Record<string, unknown>
  const discount = envelope.discount
  if (typeof discount !== "object" || discount === null) {
    return null
  }
  const row = discount as Record<string, unknown>
  if (
    typeof row.id !== "string" ||
    typeof row.store_id !== "string" ||
    typeof row.name !== "string" ||
    typeof row.type !== "string" ||
    typeof row.method !== "string" ||
    typeof row.status !== "string"
  ) {
    return null
  }

  const discountType = row.discount_type
  const parsedDiscountType: DiscountTypeApi =
    discountType === "product" ||
    discountType === "order" ||
    discountType === "buyget" ||
    discountType === "free_shipping"
      ? discountType
      : "product"

  const valueType = row.value_type
  const parsedValueType =
    valueType === "percentage" || valueType === "fixed" ? valueType : null

  return {
    id: row.id,
    store_id: row.store_id,
    name: row.name,
    code: row.code === null || typeof row.code === "string" ? row.code : null,
    type: row.type as AdminDiscountDetail["type"],
    method: row.method as AdminDiscountDetail["method"],
    status: row.status as AdminDiscountDetail["status"],
    usage_count: typeof row.usage_count === "number" ? row.usage_count : 0,
    usage_limit:
      row.usage_limit === null || typeof row.usage_limit === "number" ? row.usage_limit : null,
    expires_at:
      row.expires_at === null || typeof row.expires_at === "string" ? row.expires_at : null,
    created_at:
      row.created_at === null || typeof row.created_at === "string" ? row.created_at : null,
    updated_at:
      row.updated_at === null || typeof row.updated_at === "string" ? row.updated_at : null,
    is_automatic: row.is_automatic === true,
    promotion_type: row.promotion_type === "buyget" ? "buyget" : "standard",
    raw_status:
      row.raw_status === "active" || row.raw_status === "inactive" || row.raw_status === "draft"
        ? row.raw_status
        : "draft",
    discount_type: parsedDiscountType,
    value_type: parsedValueType,
    value: typeof row.value === "number" && Number.isFinite(row.value) ? row.value : null,
    starts_at: row.starts_at === null || typeof row.starts_at === "string" ? row.starts_at : null,
  }
}

export async function listAdminDiscounts(api?: {
  limit?: number
  offset?: number
  q?: string
  status?: "draft" | "active" | "inactive"
}): Promise<AdminDiscountListResponse> {
  const base = resolveBackendBase()
  const query = serializeQuery({
    limit: api?.limit,
    offset: api?.offset,
    q: api?.q,
    status: api?.status,
  })

  const response = await fetch(`${base}/admin/discounts${query}`, {
    method: "GET",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  const envelope = parseDiscountsListEnvelope(parsed)
  if (envelope === null) {
    throw new Error("Unexpected discount list response shape from MercFlow API.")
  }

  return envelope
}

export async function getAdminDiscount(id: string): Promise<AdminDiscountDetail> {
  const base = resolveBackendBase()
  const response = await fetch(`${base}/admin/discounts/${encodeURIComponent(id)}`, {
    method: "GET",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  const detail = parseDiscountDetail(parsed)
  if (detail === null) {
    throw new Error("Unexpected discount detail response shape from MercFlow API.")
  }

  return detail
}

export async function createAdminDiscount(
  payload: CreateDiscountPayload,
): Promise<AdminDiscountDetail> {
  const base = resolveBackendBase()
  const response = await fetch(`${base}/admin/discounts`, {
    method: "POST",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  const detail = parseDiscountDetail(parsed)
  if (detail === null) {
    throw new Error("Unexpected discount create response shape from MercFlow API.")
  }

  return detail
}

export async function updateAdminDiscount(
  id: string,
  payload: UpdateDiscountPayload,
): Promise<AdminDiscountDetail> {
  const base = resolveBackendBase()
  const response = await fetch(`${base}/admin/discounts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  const detail = parseDiscountDetail(parsed)
  if (detail === null) {
    throw new Error("Unexpected discount update response shape from MercFlow API.")
  }

  return detail
}

export async function deleteAdminDiscount(id: string): Promise<void> {
  const base = resolveBackendBase()
  const response = await fetch(`${base}/admin/discounts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}

export async function activateAdminDiscount(id: string): Promise<AdminDiscountDetail> {
  const base = resolveBackendBase()
  const response = await fetch(`${base}/admin/discounts/${encodeURIComponent(id)}/activate`, {
    method: "POST",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  const detail = parseDiscountDetail(parsed)
  if (detail === null) {
    throw new Error("Unexpected discount activate response shape from MercFlow API.")
  }

  return detail
}

export async function deactivateAdminDiscount(id: string): Promise<AdminDiscountDetail> {
  const base = resolveBackendBase()
  const response = await fetch(`${base}/admin/discounts/${encodeURIComponent(id)}/deactivate`, {
    method: "POST",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  const detail = parseDiscountDetail(parsed)
  if (detail === null) {
    throw new Error("Unexpected discount deactivate response shape from MercFlow API.")
  }

  return detail
}
