/**
 * Re-exports the admin product content HTTP handlers for consumption by
 * `apps/backend` (Medusa only scans `src/api` under the app process root).
 */
export { GET, POST } from "../api/admin/products/[id]/content/route"
