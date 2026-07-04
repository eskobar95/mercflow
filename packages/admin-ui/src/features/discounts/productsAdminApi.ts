import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

export type AdminProductPickerRow = {
  id: string
  title: string
  status: string
}

function parseProductPickerRow(raw: unknown): AdminProductPickerRow | null {
  if (typeof raw !== "object" || raw === null) {
    return null
  }
  const row = raw as Record<string, unknown>
  if (typeof row.id !== "string" || typeof row.title !== "string") {
    return null
  }
  return {
    id: row.id,
    title: row.title,
    status: typeof row.status === "string" ? row.status : "unknown",
  }
}

export async function listAdminProductsForPicker(options?: {
  q?: string
  limit?: number
}): Promise<AdminProductPickerRow[]> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Medusa backend URL missing — set VITE_MEDUSA_ADMIN_BACKEND_URL in the admin-ui env.",
    )
  }

  const params = new URLSearchParams()
  params.set("limit", String(options?.limit ?? 100))
  params.set("fields", "id,title,status")
  params.set("order", "-updated_at")
  if (options?.q !== undefined && options.q.trim() !== "") {
    params.set("q", options.q.trim())
  }

  const response = await fetch(`${base}/admin/products?${params.toString()}`, {
    method: "GET",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  if (typeof parsed !== "object" || parsed === null) {
    return []
  }
  const envelope = parsed as Record<string, unknown>
  if (!Array.isArray(envelope.products)) {
    return []
  }

  return envelope.products
    .map((entry) => parseProductPickerRow(entry))
    .filter((entry): entry is AdminProductPickerRow => entry !== null)
}
