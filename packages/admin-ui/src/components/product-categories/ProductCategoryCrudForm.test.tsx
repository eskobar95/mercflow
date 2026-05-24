import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { buildParentCategorySelectOptions } from "@/features/product-categories/buildParentCategorySelectOptions"
import type { AdminProductCategoryHierarchyRow } from "@/features/product-categories/types"

import { ProductCategoryCrudForm } from "./ProductCategoryCrudForm"

const sampleRows: AdminProductCategoryHierarchyRow[] = [
  {
    id: "pcat_a",
    name: "Clothing",
    handle: "clothing",
    depth: 0,
    description: null,
    productCount: 2,
    is_active: true,
    updated_at: "2020-01-01",
  },
  {
    id: "pcat_b",
    name: "Shirts",
    handle: "shirts",
    depth: 1,
    description: null,
    productCount: 1,
    is_active: true,
    updated_at: "2020-01-02",
  },
]

describe("ProductCategoryCrudForm", (): void => {
  it("renders create mode fields and primary action", (): void => {
    const options = buildParentCategorySelectOptions(sampleRows, new Set())

    render(
      <MemoryRouter>
        <ProductCategoryCrudForm
          mode="create"
          initialName=""
          initialHandle=""
          initialParentCategoryId={null}
          initialIsActive
          parentSelectOptions={options}
        />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: /category details/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /create category/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Parent category$/)).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: /name/i })).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: /active in storefront/i })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: /^Parent category$/ })).toBeInTheDocument()
  })

  it("shows delete controls in edit mode", (): void => {
    const options = buildParentCategorySelectOptions(sampleRows, new Set(["pcat_b"]))

    render(
      <MemoryRouter>
        <ProductCategoryCrudForm
          mode="edit"
          categoryId="pcat_b"
          initialName="Shirts"
          initialHandle="shirts"
          initialParentCategoryId="pcat_a"
          initialIsActive
          parentSelectOptions={options}
        />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: /edit category/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /delete category/i })).toBeInTheDocument()
  })
})
