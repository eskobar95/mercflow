import { slugifyCategoryHandle } from "@/features/product-categories/slugifyCategoryHandle"

/**
 * Derive a stable metafield key from a display name (snake_case).
 */
export function slugifyMetafieldKey(name: string): string {
  return slugifyCategoryHandle(name).replace(/-/g, "_")
}
