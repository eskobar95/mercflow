import type { ProductListRow } from "@/data/mockProducts"

import type { ActiveFilter } from "./filter/types"

export type DatePeriod = "today" | "week" | "month"

/** Start of calendar period in local time. Pass `now` in tests for deterministic results. */
export function startOfPeriod(period: DatePeriod, now: Date = new Date()): number {
  const d = new Date(now)
  if (period === "today") {
    d.setHours(0, 0, 0, 0)
  } else if (period === "week") {
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
  } else {
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
  }
  return d.getTime()
}

export function rowMatchesProductFilter(row: ProductListRow, filter: ActiveFilter): boolean {
  if (filter.valueIds.length === 0) return true

  let positiveMatch: boolean

  switch (filter.categoryId) {
    case "status":
      positiveMatch = filter.valueIds.includes(row.status)
      break
    case "collection":
      positiveMatch = filter.valueIds.includes(row.collection)
      break
    case "updated": {
      if (filter.operator !== "after" && filter.operator !== "before") {
        return true
      }
      const rowMs = new Date(row.updatedAt).getTime()
      if (filter.operator === "after") {
        return filter.valueIds.some(
          (v) => rowMs >= startOfPeriod(v as DatePeriod),
        )
      }
      return filter.valueIds.some(
        (v) => rowMs < startOfPeriod(v as DatePeriod),
      )
    }
    default:
      return true
  }

  return filter.operator === "is" ? positiveMatch : !positiveMatch
}
