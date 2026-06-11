import { describe, expect, it } from "vitest"

import { renderOrderConfirmationPreview } from "../src/templates/render-order-confirmation-preview"

describe("renderOrderConfirmationPreview", () => {
  it("includes branding variables in rendered HTML", () => {
    const html = renderOrderConfirmationPreview({
      logoUrl: "https://cdn.example.com/logo.png",
      brandColor: "#112233",
      storeName: "Sample Store",
      replyTo: "hello@example.com",
      supportEmail: "support@example.com",
    })

    expect(html).toContain("https://cdn.example.com/logo.png")
    expect(html).toContain("#112233")
    expect(html).toContain("Sample Store")
    expect(html).toContain("hello@example.com")
    expect(html).toContain("support@example.com")
  })
})
