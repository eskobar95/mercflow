import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import { parseAdminLocalesList } from "./parseAdminLocalesList"
import type { AdminLocale } from "./types"

const ADMIN_LOCALES_LIST_PATH = "/admin/locales"

type ListAdminLocalesOptions = {
  /** Max locales to fetch; default 100 */
  limit?: number
}

/**
 * Lists store locales from Medusa Admin (`GET /admin/locales`).
 * Uses the same env and auth as product/category content requests.
 */
export async function listAdminLocales(
  options: ListAdminLocalesOptions = {}
): Promise<AdminLocale[]> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const limit = options.limit ?? 100
  const params = new URLSearchParams()
  params.set("limit", String(limit))
  params.set("offset", "0")
  /** Oldest-first matches typical “default locale added first” ordering; Medusa has no `is_default` on AdminLocale. */
  params.set("order", "created_at")

  const url = `${base}${ADMIN_LOCALES_LIST_PATH}?${params.toString()}`
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  return parseAdminLocalesList(json)
}
