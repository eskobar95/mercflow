import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

const mutatePatch = vi.fn()
const mutateTest = vi.fn()

vi.mock("@/hooks/useShipmondoConnectorSettings", () => ({
  useShipmondoConnectorSettings: () => ({
    query: {
      isLoading: false,
      isError: false,
      isSuccess: true,
      error: null,
      data: {
        type: "shipmondo" as const,
        active: false,
        lastTestedAt: null,
        credentials: {
          apiUserConfigured: true,
          apiKeyConfigured: true,
          shippingModuleKeyConfigured: false,
        },
        recentLogs: [],
      },
    },
    patch: {
      isPending: false,
      isError: false,
      error: null,
      mutate: mutatePatch,
    },
    test: {
      isPending: false,
      isIdle: true,
      isSuccess: false,
      data: undefined,
      mutate: mutateTest,
    },
  }),
}))

import { ShipmondoConnectorWorkspace } from "@/components/connectors/shipmondo/ShipmondoConnectorWorkspace"

describe("ShipmondoConnectorWorkspace", (): void => {
  it("renders the configuration surface when data is available", (): void => {
    render(
      <MemoryRouter>
        <ShipmondoConnectorWorkspace />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: "Shipmondo" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save settings" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Test connection" })).toBeEnabled()
  })
})
