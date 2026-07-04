import Medusa from "@medusajs/js-sdk"

import { adminTokenStore } from "@/medusa-admin/adminTokenStore"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type MedusaAdminTokenStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * Medusa JS SDK reads the active admin bearer token on every request via custom JWT
 * storage backed by {@link adminTokenStore}. Do not snapshot Authorization into
 * `globalHeaders` — Clerk token refresh would leave long-lived SDK clients stale.
 */
const medusaAdminTokenStorage: MedusaAdminTokenStorage = {
  getItem(_key: string): string | null {
    return adminTokenStore.get()
  },
  setItem(_key: string, value: string): void {
    adminTokenStore.set(value)
  },
  removeItem(_key: string): void {
    adminTokenStore.clear()
  },
}

/** Admin API base `{MEDUSA_BACKEND}/admin`; Vite exposes backend root as `VITE_MEDUSA_ADMIN_BACKEND_URL`. */
export function createMercflowMedusaSdk(): Medusa | null {
  const baseUrl = resolveMedusaAdminBackendUrl()
  if (baseUrl === null) {
    return null
  }

  return new Medusa({
    baseUrl,
    globalHeaders: {
      "Content-Type": "application/json",
    },
    auth: {
      type: "jwt",
      jwtTokenStorageMethod: "custom",
      storage: medusaAdminTokenStorage,
    },
  })
}
