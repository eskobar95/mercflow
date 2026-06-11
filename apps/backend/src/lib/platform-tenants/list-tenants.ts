import { getPlatformDbPool, isPlatformDbConfigured } from "../platform-db/platform-db"
import type { PlatformTenantRow } from "./types"

function extractDomainFromStorefrontUrl(storefrontUrl: string | null): string | null {
  if (storefrontUrl === null || storefrontUrl.trim() === "") {
    return null
  }

  try {
    const hostname = new URL(storefrontUrl).hostname
    return hostname.length > 0 ? hostname : null
  } catch {
    return null
  }
}

export async function listPlatformTenants(): Promise<PlatformTenantRow[]> {
  if (!isPlatformDbConfigured()) {
    throw new Error("PLATFORM_DATABASE_URL is not configured")
  }

  const result = await getPlatformDbPool().query<{
    id: string
    name: string
    is_disabled: boolean
    created_at: Date
    storefront_url: string | null
  }>(
    `SELECT
       s.id,
       s.name,
       COALESCE(s.is_disabled, false) AS is_disabled,
       s.created_at,
       seo.storefront_url
     FROM store s
     LEFT JOIN mercflow_seo_config seo
       ON seo.store_id = s.id
       AND seo.deleted_at IS NULL
     WHERE s.deleted_at IS NULL
     ORDER BY s.created_at DESC`,
  )

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    domain: extractDomainFromStorefrontUrl(row.storefront_url),
    is_disabled: row.is_disabled,
    created_at: row.created_at.toISOString(),
  }))
}

export async function getPlatformTenantById(
  storeId: string,
): Promise<PlatformTenantRow | null> {
  const tenants = await listPlatformTenants()
  return tenants.find((tenant) => tenant.id === storeId) ?? null
}
