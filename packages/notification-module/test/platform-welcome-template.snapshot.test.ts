import { render } from "@react-email/render"
import { describe, expect, it } from "vitest"

import { PlatformWelcomeTemplate } from "../src/templates/platform-welcome"

describe("PlatformWelcomeTemplate", () => {
  it("renders HTML containing welcome message and admin CTA", async (): Promise<void> => {
    const html = await render(
      PlatformWelcomeTemplate({
        recipientEmail: "merchant@example.com",
        storeName: "Kaffehuset",
        tenantUrl: "https://kaffehuset.mercflow.shop",
        adminUrl: "https://admin.mercflow.shop",
      }),
    )

    expect(html).toContain("Welcome to MercFlow")
    expect(html).toContain("Kaffehuset")
    expect(html).toContain("Open Store Admin")
    expect(html).toContain("https://kaffehuset.mercflow.shop")
  })
})
