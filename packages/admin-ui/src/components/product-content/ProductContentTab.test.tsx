import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ProductContentTab } from "@/components/product-content/ProductContentTab"

type UseAdminLocalesReturn = ReturnType<
  typeof import("@/features/content-locale/useAdminLocales").useAdminLocales
>

const mockUseProductContentState = vi.fn()
const mockUseAdminLocales = vi.hoisted(() => vi.fn())

vi.mock("@/components/auth/AdminAuthReadyContext", () => ({
  useAdminAuthReady: (): boolean => true,
}))

vi.mock("@/features/content-locale", () => ({
  useAdminLocales: (): UseAdminLocalesReturn => mockUseAdminLocales() as UseAdminLocalesReturn,
  useContentLocale: ({
    locales,
    preferredCode,
  }: {
    locales: { code: string; name: string }[]
    preferredCode?: string
  }) => ({
    activeLocaleCode: preferredCode ?? locales[0]?.code ?? "en",
    editingLocaleCode: preferredCode ?? locales[0]?.code ?? "en",
    setActiveLocaleCode: vi.fn(),
    activeLocale: locales[0] ?? null,
  }),
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
    expect(screen.getByRole("button", { name: "Add content" })).toBeInTheDocument()
  })

  it("renders editable layout with headings and toolbar when content is loaded", (): void => {
    mockUseProductContentState.mockReturnValue({
      content: {
        id: "pct_test",
        product_id: "p_1",
        locale: "da-DK",
        version: 2,
        body_json: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Hello storefront" }] }],
        },
        seo_title: "Sample CMS meta title",
        seo_description: "Snippet",
        og_image_url: "https://example.com/img.png",
        canonical_url_override: null,
        status: "published",
      },
      loading: false,
      saving: false,
      loadError: null,
      saveError: null,
      save: vi.fn(),
      load: vi.fn(),
      clearError: vi.fn(),
    })

    render(<ProductContentTab productId="p_1" productTitleFallback="Product name" />)

    expect(screen.getByRole("heading", { name: "Rich text description" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Heading 2" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Heading 3" })).toBeInTheDocument()
    expect(screen.getByLabelText("Content save version 2")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "SEO" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save content" })).toBeInTheDocument()
    expect(screen.getByLabelText("Meta title")).toHaveValue("Sample CMS meta title")
    expect(screen.getByLabelText("Meta description")).toHaveValue("Snippet")
  })
})
