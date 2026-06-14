import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { DevelopersSettingsPage } from "@/pages/settings/developers/DevelopersSettingsPage"
import { TEST_PUBLISHABLE_REDACTED, TEST_PUBLISHABLE_TOKEN } from "./fixtures/apiKeyFixtures"

vi.mock("@/medusa-admin/medusaAdminFetch", () => ({
  resolveMedusaAdminBackendUrl: (): string => "http://localhost:9000",
}))

const mockUsePublishableApiKey = vi.fn()

vi.mock("@/hooks/usePublishableApiKey", () => ({
  usePublishableApiKey: (): ReturnType<typeof mockUsePublishableApiKey> =>
    mockUsePublishableApiKey(),
}))

describe("DevelopersSettingsPage", (): void => {
  it("renders publishable key with copy action", async (): Promise<void> => {
    mockUsePublishableApiKey.mockReturnValue({
      status: "success",
      key: {
        id: "apk_1",
        title: "Storefront",
        type: "publishable",
        token: TEST_PUBLISHABLE_TOKEN,
        redacted: TEST_PUBLISHABLE_REDACTED,
        revoked_at: null,
        created_at: "2026-01-01T00:00:00.000Z",
        sales_channels: [],
      },
      revealedToken: null,
      reload: vi.fn(),
      regenerate: vi.fn(),
      isRegenerating: false,
      regenerateError: null,
    })

    render(
      <MemoryRouter initialEntries={["/settings/developers?tab=api-keys"]}>
        <DevelopersSettingsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole("heading", { name: "Developers" })).toBeDefined()

    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    fireEvent.click(screen.getByRole("button", { name: "Copy publishable API key" }))
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(TEST_PUBLISHABLE_TOKEN)
    })
  })

  it("shows webhooks placeholder on webhooks tab", (): void => {
    mockUsePublishableApiKey.mockReturnValue({
      status: "loading",
      reload: vi.fn(),
      regenerate: vi.fn(),
      isRegenerating: false,
      regenerateError: null,
    })

    render(
      <MemoryRouter initialEntries={["/settings/developers?tab=webhooks"]}>
        <DevelopersSettingsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText("Webhook management coming soon")).toBeDefined()
  })
})
