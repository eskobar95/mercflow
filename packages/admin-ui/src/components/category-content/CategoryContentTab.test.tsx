import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CategoryContentTab } from "@/components/category-content/CategoryContentTab"
import { useAdminLocales } from "@/features/content-locale"

type UseAdminLocalesResult = ReturnType<typeof useAdminLocales>

const mockUseCategoryContentState = vi.fn()
const mockUseAdminLocales = vi.hoisted(() => vi.fn())

vi.mock("@/features/content-locale", () => ({
  useAdminLocales: (): UseAdminLocalesResult => mockUseAdminLocales() as UseAdminLocalesResult,
}))

vi.mock("@/features/category-content", async (original) => {
  const actual = await original<(typeof import("@/features/category-content"))>()
  return {
    ...actual,
    useCategoryContentState: (...args: unknown[]) =>
      mockUseCategoryContentState(...args) as ReturnType<(typeof actual)["useCategoryContentState"]>,
  }
})

describe("CategoryContentTab", (): void => {
  beforeEach((): void => {
    mockUseAdminLocales.mockReset()
    mockUseAdminLocales.mockReturnValue({
      locales: [{ code: "da", name: "Dansk" }],
      loading: false,
      error: null,
      reload: vi.fn(),
    })

    mockUseCategoryContentState.mockReset()
    mockUseCategoryContentState.mockReturnValue({
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
    render(<CategoryContentTab categoryId="pcat_1" categoryTitleFallback="" />)

    expect(screen.getByText("No content yet.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add content" })).toBeInTheDocument()
  })

  it("renders editable layout with headings and toolbar when content is loaded", (): void => {
    mockUseCategoryContentState.mockReturnValue({
      content: {
        id: "cct_test",
        category_id: "pcat_1",
        locale: "da",
        version: 2,
        body_json: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Hej kategori" }] }],
        },
        seo_title: "CMS meta",
        seo_description: "Uddrag",
        og_image_url: "https://example.com/og.png",
        banner_image_url: "https://example.com/b.png",
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

    render(<CategoryContentTab categoryId="pcat_1" categoryTitleFallback="Kategori" />)

    expect(screen.getByRole("heading", { name: "Rich text description" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Heading 2" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Heading 3" })).toBeInTheDocument()
    expect(screen.getByLabelText("Content save version 2")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "SEO" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save content" })).toBeInTheDocument()
  })
})
