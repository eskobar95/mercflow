import { describe, expect, it } from "vitest"

import { pagePublicPathFromSlug } from "../src/modules/seo/utils/paths"

describe("pagePublicPathFromSlug", (): void => {
  it("omits locale query for default en", (): void => {
    expect(pagePublicPathFromSlug("about", "en")).toBe("/pages/about")
  })

  it("appends locale query for non-default locales", (): void => {
    expect(pagePublicPathFromSlug("om-os", "da")).toBe("/pages/om-os?locale=da")
  })
})
