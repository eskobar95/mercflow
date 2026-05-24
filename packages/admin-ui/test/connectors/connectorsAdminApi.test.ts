import { describe, expect, it } from "vitest"

import { parseConnectorsListPayload } from "@/features/connectors/connectorsAdminApi"

describe("parseConnectorsListPayload", () => {
  it("parses MercFlow envelopes with four integrations", (): void => {
    const parsed = parseConnectorsListPayload({
      data: [
        { type: "shipmondo", active: false, configured: false, lastTestedAt: null },
        { type: "stripe", active: true, configured: false, lastTestedAt: null },
        { type: "plunk", active: false, configured: false, lastTestedAt: null },
        { type: "gtm", active: false, configured: false, lastTestedAt: null },
      ],
    })

    expect(parsed).not.toBeNull()
    expect(parsed?.every((row) => row.lastTestedAt === null)).toBe(true)
  })

  it("rejects unknown connector slugs", (): void => {
    const parsed = parseConnectorsListPayload({
      data: [
        { type: "paypal", active: false, configured: false, lastTestedAt: null },
        { type: "stripe", active: false, configured: false, lastTestedAt: null },
        { type: "plunk", active: false, configured: false, lastTestedAt: null },
        { type: "gtm", active: false, configured: false, lastTestedAt: null },
      ],
    })

    expect(parsed).toBeNull()
  })
})
