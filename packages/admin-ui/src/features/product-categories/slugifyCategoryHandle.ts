import { slugifyForStrategy } from "@mercflow/seo-module/slug"

import type { SlugStrategy } from "@/features/seo/types"

/**
 * Produces a MercFlow catalog handle from a display name using the active SEO slug strategy.
 */
export function slugifyCategoryHandle(
  name: string,
  strategy: SlugStrategy = "nordic"
): string {
  const trimmed = name.trim()
  if (trimmed === "") {
    return ""
  }
  return slugifyForStrategy(trimmed, strategy)
}
