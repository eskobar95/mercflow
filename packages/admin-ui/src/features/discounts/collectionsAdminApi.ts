import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

export type AdminCollectionRow = {
  id: string
  title: string
}

function parseCollectionRow(raw: unknown): AdminCollectionRow | null {
  if (typeof raw !== "object" || raw === null) {
    return null
  }
  const row = raw as Record<string, unknown>
  if (typeof row.id !== "string" || typeof row.title !== "string") {
    return null
  }
  return { id: row.id, title: row.title }
}

export async function listAdminCollections(): Promise<AdminCollectionRow[]> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Medusa backend URL missing — set VITE_MEDUSA_ADMIN_BACKEND_URL in the admin-ui env.",
    )
  }

  const response = await fetch(`${base}/admin/collections?limit=100`, {
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
  if (!Array.isArray(envelope.collections)) {
    return []
  }

  return envelope.collections
    .map((entry) => parseCollectionRow(entry))
    .filter((entry): entry is AdminCollectionRow => entry !== null)
}
