import { createElement } from "react"
import { render } from "@react-email/render"
import { describe, expect, it } from "vitest"

import {
  buildSampleOrderConfirmationProps,
  OrderConfirmationTemplate,
} from "../src/templates"

describe("OrderConfirmationTemplate", (): void => {
  it("renders HTML containing order number and customer email", async (): Promise<void> => {
    const props = buildSampleOrderConfirmationProps()
    const html = await render(createElement(OrderConfirmationTemplate, props))

    expect(html).toContain("1001")
    expect(html).toContain("buyer@example.com")
    expect(html).toContain("Classic Tee")
    expect(html).toContain("View order")
    expect(html).toMatchSnapshot()
  })
})
