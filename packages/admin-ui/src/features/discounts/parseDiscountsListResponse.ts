import type { AdminDiscountListResponse, AdminDiscountRow } from "./types"

export type { AdminDiscountListResponse, AdminDiscountRow } from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseDiscountRow(value: unknown): AdminDiscountRow | null {
  if (!isRecord(value)) {
    return null
  }

  const {
    id,
    store_id,
    name,
    code,
    type,
    method,
    status,
    usage_count,
    usage_limit,
    expires_at,
    created_at,
    updated_at,
  } = value

  if (
    typeof id !== "string" ||
    typeof store_id !== "string" ||
    typeof name !== "string" ||
    typeof type !== "string" ||
    typeof method !== "string" ||
    typeof status !== "string" ||
    typeof usage_count !== "number"
  ) {
    return null
  }

  return {
    id,
    store_id,
    name,
    code: typeof code === "string" || code === null ? code : null,
    type: type as AdminDiscountRow["type"],
    method: method as AdminDiscountRow["method"],
    status: status as AdminDiscountRow["status"],
    usage_count,
    usage_limit: typeof usage_limit === "number" || usage_limit === null ? usage_limit : null,
    expires_at: typeof expires_at === "string" || expires_at === null ? expires_at : null,
    created_at: typeof created_at === "string" || created_at === null ? created_at : null,
    updated_at: typeof updated_at === "string" || updated_at === null ? updated_at : null,
  }
}

export function parseDiscountsListEnvelope(value: unknown): AdminDiscountListResponse | null {
  if (!isRecord(value)) {
    return null
  }

  const { data, count, limit, offset } = value
  if (!Array.isArray(data) || typeof count !== "number") {
    return null
  }

  const rows: AdminDiscountRow[] = []
  for (const entry of data) {
    const row = parseDiscountRow(entry)
    if (row === null) {
      return null
    }
    rows.push(row)
  }

  return {
    data: rows,
    count,
    limit: typeof limit === "number" ? limit : rows.length,
    offset: typeof offset === "number" ? offset : 0,
  }
}
