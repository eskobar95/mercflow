import { createElement } from "react"
import { render } from "@react-email/render"
import { describe, expect, it } from "vitest"

import {
  buildSampleOrderCancellationProps,
  OrderCancellationTemplate,
} from "../src/templates"

describe("OrderCancellationTemplate", (): void => {
  it("renders HTML containing order number and cancellation details", async (): Promise<void> => {
    const props = buildSampleOrderCancellationProps()
    const html = await render(createElement(OrderCancellationTemplate, props))

    expect(html).toContain("1001")
    expect(html).toContain("Customer requested cancellation before fulfillment.")
    expect(html).toContain("refund")
    expect(html).toMatchSnapshot()
  })
})
