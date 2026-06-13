/**
 * Client-side mirror of backend `MERCFLOW_PUBLIC_SIGNUP`.
 * Vite exposes only `VITE_*` vars — see `.env.example`.
 */
export function isPublicSignupEnabled(): boolean {
  return import.meta.env.VITE_MERCFLOW_PUBLIC_SIGNUP === "true"
}
