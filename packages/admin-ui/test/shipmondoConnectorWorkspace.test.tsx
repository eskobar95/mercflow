import type { ReactElement } from "react"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

const mutatePatch = vi.fn()
const mutateTest = vi.fn()

vi.mock("@/hooks/useShipmondoConnectorSettings", () => ({
  useShipmondoConnectorSettings: () => ({
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
      shippingRules: {
        markupAmountMinor: 0,
        freeShippingThresholdMinor: 0,
        enabledCarrierCodes: [],
      },
      labelSettings: {
        senderName: "",
        senderAddress1: "",
        senderPostalCode: "",
        senderCity: "",
        senderCountryCode: "DK",
        senderEmail: "",
        senderPhone: "",
        labelFormat: "10x19_pdf",
        ownAgreement: false,
      },
    },
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch: vi.fn(),
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

vi.mock("@/components/connectors/shipmondo/ShipmondoSenderSettingsSection", (): { ShipmondoSenderSettingsSection: () => ReactElement } => ({
  ShipmondoSenderSettingsSection: (): ReactElement => <></>,
}))

vi.mock("@/components/connectors/shipmondo/ShipmondoShippingRulesSection", (): { ShipmondoShippingRulesSection: () => ReactElement } => ({
  ShipmondoShippingRulesSection: (): ReactElement => <></>,
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
