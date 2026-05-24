import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import type { AdminProductCategoryHierarchyRow } from "@/features/product-categories/types"

import { ProductCategoryHierarchyTable } from "./ProductCategoryHierarchyTable"

const SAMPLE_ROW: AdminProductCategoryHierarchyRow = {
  depth: 0,
  handle: "apparel",
  id: "pcat_123",
  is_active: true,
  description: null,
  name: "Apparel",
  productCount: 12,
  updated_at: "2026-03-03T09:18:04.021Z",
}

describe("ProductCategoryHierarchyTable", () => {
  it("renders the category row with status and product count labels", (): void => {
    render(
      <MemoryRouter>
        <ProductCategoryHierarchyTable rows={[SAMPLE_ROW]} />
      </MemoryRouter>
    )

    expect(screen.getByRole("columnheader", { name: /name/i })).toBeTruthy()
    expect(screen.getByRole("link", { name: SAMPLE_ROW.name })).toHaveAttribute(
      "href",
      `/product-categories/${encodeURIComponent(SAMPLE_ROW.id)}`
    )
    expect(screen.getByText(String(SAMPLE_ROW.productCount))).toBeTruthy()
    expect(screen.getByText("Active")).toBeTruthy()
    expect(screen.getByText(SAMPLE_ROW.handle)).toBeTruthy()
  })

  it("shows the empty overlay when loaded with zero categories", (): void => {
    render(
      <MemoryRouter>
        <ProductCategoryHierarchyTable
          rows={[]}
          emptyState={<div>Nothing loaded</div>}
        />
      </MemoryRouter>
    )

    expect(screen.getByText("Nothing loaded")).toBeTruthy()
  })
})
