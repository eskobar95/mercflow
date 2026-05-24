/**
 * Re-exports GET + PATCH handlers for MercFlow CMS product content mutations.
 *
 * Dynamic segment `:id`:
 * - `GET` resolves `id` as a Medusa product id (`product.id`).
 * - `PATCH` resolves `id` as a `product_content` row id.
 */
export { GET, PATCH } from "../api/admin/product-content/[id]/route"
