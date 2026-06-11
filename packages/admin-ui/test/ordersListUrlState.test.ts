import { describe, expect, it } from "vitest"

import {
  buildOrdersListDetailPath,
  parseOrdersListSearchParams,
  serializeOrdersListSearchParams,
} from "@/features/orders/ordersListUrlState"

describe("ordersListUrlState", () => {
  it("round-trips list filters through listReturn on detail links", () => {
    const snapshot = {
      search: "guapo",
      activeFilters: [
        {
          categoryId: "status",
          operator: "is" as const,
          valueIds: ["pending"],
        },
      ],
      page: 2,
      pageSize: 25,
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
      sort: { column: "createdAt" as const, direction: "desc" as const },
    }

    const serialized = serializeOrdersListSearchParams(snapshot)
    const detailPath = buildOrdersListDetailPath("order_123", snapshot)

    expect(detailPath).toContain("listReturn=")
    expect(parseOrdersListSearchParams(new URLSearchParams(serialized))).toMatchObject({
      search: "guapo",
      page: 2,
      pageSize: 25,
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
      sort: { column: "createdAt", direction: "desc" },
      activeFilters: snapshot.activeFilters,
    })
  })
})
