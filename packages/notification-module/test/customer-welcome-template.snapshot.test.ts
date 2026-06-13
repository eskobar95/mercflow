import { createElement } from "react"
import { render } from "@react-email/render"
import { describe, expect, it } from "vitest"

import {
  buildSampleCustomerWelcomeProps,
  CustomerWelcomeTemplate,
} from "../src/templates"

describe("CustomerWelcomeTemplate", (): void => {
  it("renders HTML containing welcome message and store CTA", async (): Promise<void> => {
    const props = buildSampleCustomerWelcomeProps()
    const html = await render(createElement(CustomerWelcomeTemplate, props))

    expect(html).toContain("Jane")
    expect(html).toContain("Example Shop")
    expect(html).toContain("Visit store")
    expect(html).toMatchSnapshot()
  })
})
