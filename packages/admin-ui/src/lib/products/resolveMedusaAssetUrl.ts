import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

/**
 * Normalizes thumbnail / image URLs from Medusa admin responses into an absolute browser URL when needed.
 */
export function resolveMedusaAssetUrl(asset: string | null | undefined): string | null {
  if (asset === undefined || asset === null || asset.trim() === "") {
    return null
  }
  const trimmed = asset.trim()
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  const backend = resolveMedusaAdminBackendUrl()
  if (backend === null) {
    return null
  }
  if (trimmed.startsWith("/")) {
    return `${backend}${trimmed}`
  }
  return `${backend}/${trimmed}`
}
