import { createElement } from "react"
import { render } from "@react-email/render"
import { describe, expect, it } from "vitest"

import {
  buildSampleShippingUpdateProps,
  ShippingUpdateTemplate,
} from "../src/templates"

describe("ShippingUpdateTemplate", (): void => {
  it("renders HTML containing order number and tracking details", async (): Promise<void> => {
    const props = buildSampleShippingUpdateProps()
    const html = await render(createElement(ShippingUpdateTemplate, props))

    expect(html).toContain("1001")
    expect(html).toContain("PostNord")
    expect(html).toContain("PN123456789DK")
    expect(html).toContain("Track shipment")
    expect(html).toMatchSnapshot()
  })
})
