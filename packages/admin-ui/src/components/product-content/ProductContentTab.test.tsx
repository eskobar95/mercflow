import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ProductContentTab } from "@/components/product-content/ProductContentTab"
import type { UseAdminLocalesResult } from "@/features/content-locale/useAdminLocales"

const mockUseProductContentState = vi.fn()
const mockUseAdminLocales = vi.hoisted(() => vi.fn())

vi.mock("@/features/content-locale", () => ({
  useAdminLocales: (): UseAdminLocalesResult => mockUseAdminLocales() as UseAdminLocalesResult,
}))

vi.mock("@/features/product-content", async (original) => {
  const actual = await original<(typeof import("@/features/product-content"))>()
  return {
    ...actual,
    useProductContentState: (...args: unknown[]) =>
      mockUseProductContentState(...args) as ReturnType<(typeof actual)["useProductContentState"]>,
  }
})

describe("ProductContentTab", () => {
  beforeEach(() => {
    mockUseAdminLocales.mockReset()
    mockUseAdminLocales.mockReturnValue({
      locales: [{ code: "en", name: "English" }],
      loading: false,
      error: null,
      reload: vi.fn(),
    })

    mockUseProductContentState.mockReset()
    mockUseProductContentState.mockReturnValue({
      content: null,
      loading: false,
      saving: false,
      loadError: null,
      saveError: null,
      save: vi.fn(),
      load: vi.fn(),
      clearError: vi.fn(),
    })
  })

  it("shows empty state and Add content action", (): void => {
    render(<ProductContentTab productId="p_1" productTitleFallback="" />)

    expect(screen.getByText("No content yet.")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Add content" })
    ).toBeInTheDocument()
  })

  it("shows locale badge and CMS summary when loaded", (): void => {
    mockUseProductContentState.mockReturnValue({
      content: {
        body_json: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Hello storefront" }] }],
        },
        seo_title: "Sample CMS meta title",
        seo_description: "Snippet",
        og_image_url: "https://example.com/img.png",
        status: "published",
        locale: "da-DK",
      },
      loading: false,
      saving: false,
      loadError: null,
      saveError: null,
      save: vi.fn(),
      load: vi.fn(),
      clearError: vi.fn(),
    })

    render(<ProductContentTab productId="p_1" productTitleFallback="" />)

    expect(screen.getByText("Hello storefront")).toBeInTheDocument()
    expect(screen.getByText("DA")).toBeInTheDocument()
    expect(screen.getAllByText("Sample CMS meta title").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Snippet")).toBeInTheDocument()
    expect(screen.getByText("https://example.com/img.png")).toBeInTheDocument()
  })
})
