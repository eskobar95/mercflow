/**
 * Tenant store id for MercFlow admin extension routes (`?store_id=`).
 * Set `VITE_MERCFLOW_DEFAULT_STORE_ID` in admin-ui env for single-tenant dev.
 */
export function resolveMercflowStoreIdForAdmin(): string | null {
  const raw = import.meta.env.VITE_MERCFLOW_DEFAULT_STORE_ID
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim()
  }
  return null
}

export function appendMercflowStoreQuery(url: string, storeId: string | null): string {
  if (storeId === null) {
    return url
  }
  const sep = url.includes("?") ? "&" : "?"
  return `${url}${sep}store_id=${encodeURIComponent(storeId)}`
}
