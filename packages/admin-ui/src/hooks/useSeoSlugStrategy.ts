import { useEffect, useState } from "react"

import { getAdminSeoConfig } from "@/features/seo/seoConfigApi"
import type { SlugStrategy } from "@/features/seo/types"

type UseSeoSlugStrategyReturn = {
  strategy: SlugStrategy
  loading: boolean
}

/**
 * Loads the tenant slug strategy from MercFlow SEO config (defaults to Nordic while loading).
 */
export function useSeoSlugStrategy(): UseSeoSlugStrategyReturn {
  const [strategy, setStrategy] = useState<SlugStrategy>("nordic")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async (): Promise<void> => {
      try {
        const config = await getAdminSeoConfig()
        if (!cancelled) {
          setStrategy(config.slug_strategy)
        }
      } catch {
        if (!cancelled) {
          setStrategy("nordic")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { strategy, loading }
}
