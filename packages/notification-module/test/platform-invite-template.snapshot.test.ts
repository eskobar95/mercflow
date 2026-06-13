import { createElement } from "react"
import { render } from "@react-email/render"
import { describe, expect, it } from "vitest"

import { PlatformInviteTemplate } from "../src/templates/platform-invite"

describe("PlatformInviteTemplate", () => {
  it("renders invite CTA and signup URL", async () => {
    const html = await render(
      createElement(PlatformInviteTemplate, {
        inviteUrl: "https://admin.mercflow.shop/signup?invite=abc",
        recipientEmail: "merchant@example.com",
      }),
    )

    expect(html).toContain("invited to MercFlow")
    expect(html).toContain("merchant@example.com")
    expect(html).toContain("https://admin.mercflow.shop/signup?invite=abc")
    expect(html).toContain("Set up your store")
  })
})
