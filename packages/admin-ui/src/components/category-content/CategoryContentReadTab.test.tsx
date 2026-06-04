import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CategoryContentReadTab } from "@/components/category-content/CategoryContentReadTab"

import { useAdminLocales } from "@/features/content-locale/useAdminLocales"

const mockGetCategoryContentRead = vi.hoisted(() => vi.fn())
const mockUseAdminLocales = vi.hoisted(() => vi.fn())

vi.mock("@/features/category-content/categoryContentApi", async (original) => {
  const actual = await original<(typeof import("@/features/category-content/categoryContentApi"))>()
  return {
    ...actual,
    getCategoryContentRead: (...args: unknown[]) =>
      mockGetCategoryContentRead(...args) as ReturnType<(typeof actual)["getCategoryContentRead"]>,
  }
})

type AdminLocalesHookResult = ReturnType<typeof useAdminLocales>

vi.mock("@/features/content-locale", () => ({
  useAdminLocales: (): AdminLocalesHookResult =>
    mockUseAdminLocales() as AdminLocalesHookResult,
}))

describe("CategoryContentReadTab", () => {
  beforeEach(() => {
    mockUseAdminLocales.mockReset()
    mockUseAdminLocales.mockReturnValue({
      locales: [{ code: "en", name: "English" }],
      loading: false,
      error: null,
      reload: vi.fn(),
    })

    mockGetCategoryContentRead.mockReset()
    mockGetCategoryContentRead.mockResolvedValue(null)
  })

  it("shows empty state when MercFlow CMS row does not exist", async () => {
    render(<CategoryContentReadTab categoryId="pcat_a" categoryTitleFallback="Coffee" />)

    expect(await screen.findByRole("heading", { name: "No MercFlow content yet" })).toBeInTheDocument()
  })

  it("renders preview and SEO read-only sections when CMS payload loads", async () => {
    mockGetCategoryContentRead.mockResolvedValue({
      id: "cc_1",
      category_id: "pcat_a",
      locale: "en",
      version: 1,
      body_json: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Hello category" }] }],
      },
      seo_title: "Meta title sample",
      seo_description: "Meta description sample",
      og_image_url: "https://example.com/file.png",
      banner_image_url: null,
      status: "published",
    })

    render(<CategoryContentReadTab categoryId="pcat_a" categoryTitleFallback="Coffee" />)

    expect(await screen.findByRole("heading", { name: "Description preview" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "SEO fields" })).toBeInTheDocument()
    expect(screen.getAllByText("Meta description sample")[0]).toBeInTheDocument()
    expect(screen.getByText("Hello category")).toBeInTheDocument()
  })
})
