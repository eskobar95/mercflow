import { expect, it } from "vitest"

import { SEO_MODULE } from "../src/modules/seo"

it("exposes SEO module key", (): void => {
  expect(SEO_MODULE).toBe("mercflow_seo")
})
