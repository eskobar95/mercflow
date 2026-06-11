import { useMemo } from "react"
import { useSearchParams } from "react-router-dom"

import { buildListHrefFromReturnParam } from "@/lib/routing/listReturnSearch"

/**
 * Builds a list-page href that restores filters/pagination encoded in `listReturn`.
 */
export function useListReturnHref(listPath: string): string {
  const [searchParams] = useSearchParams()

  return useMemo(
    () => buildListHrefFromReturnParam(listPath, searchParams),
    [listPath, searchParams],
  )
}
