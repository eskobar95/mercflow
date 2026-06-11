/**
 * Module-level singleton holding the active admin auth token.
 *
 * When Clerk is configured the token is set (and periodically refreshed) by
 * `useAdminTokenSync` inside AdminShell. All API helpers read from this store
 * so they pick up the current token without needing to be hooks themselves.
 *
 * Fallback: if never set, `get()` returns the static `VITE_MEDUSA_ADMIN_BEARER_TOKEN`
 * env var so local dev without Clerk continues to work unchanged.
 */

let _token: string | null = null

export const adminTokenStore = {
  set(token: string): void {
    _token = token
  },

  clear(): void {
    _token = null
  },

  get(): string | null {
    if (_token) return _token
    const envToken = import.meta.env.VITE_MEDUSA_ADMIN_BEARER_TOKEN
    if (typeof envToken === "string" && envToken.trim() !== "") {
      return envToken.trim()
    }
    return null
  },
}
