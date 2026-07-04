import Medusa, { type ClientHeaders } from "@medusajs/js-sdk"

import { buildMedusaAdminJsonHeaders, resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

/** Admin API base `{MEDUSA_BACKEND}/admin`; Vite exposes backend root as `VITE_MEDUSA_ADMIN_BACKEND_URL`. */
export function createMercflowMedusaSdk(): Medusa | null {
  const baseUrl = resolveMedusaAdminBackendUrl()
  if (baseUrl === null) {
    return null
  }

  const globalHeaders = buildMedusaAdminJsonHeaders() as ClientHeaders

  return new Medusa({
    baseUrl,
    globalHeaders,
    auth: {
      type: "session",
      fetchCredentials: "include",
    },
  })
}
