import { describe, expect, it } from "vitest"

import {
  appendSitemapDirective,
  defaultRobotsStructuredConfig,
  renderRobotsTxt,
} from "../src/modules/seo/robots-service"
import type { MercflowRobotsConfigRecord } from "../src/modules/seo/robots-types"

function baseConfig(
  overrides: Partial<MercflowRobotsConfigRecord> = {}
): MercflowRobotsConfigRecord {
  return {
    id: "rob_1",
    store_id: "store_01KG0VBTT0714XV2CCTEBRVC47",
    structured_rules: defaultRobotsStructuredConfig(),
    freetext_override: null,
    change_history: [],
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  }
}

describe("renderRobotsTxt", (): void => {
  it("renders allow rule for Googlebot-style agent", (): void => {
    const text = renderRobotsTxt(
      baseConfig({
        structured_rules: {
          rules: [
            {
              user_agent: "Googlebot",
              allow: ["/"],
              disallow: [],
            },
          ],
        },
      }),
      "https://shop.example"
    )
    expect(text).toContain("User-agent: Googlebot")
    expect(text).toContain("Allow: /")
    expect(text).toContain("Sitemap: https://shop.example/sitemap.xml")
  })

  it("uses freetext override when set", (): void => {
    const text = renderRobotsTxt(
      baseConfig({ freetext_override: "User-agent: *\nDisallow: /private" }),
      "https://shop.example"
    )
    expect(text).toContain("Disallow: /private")
    expect(text).not.toContain("User-agent: Googlebot")
  })
})

describe("appendSitemapDirective", (): void => {
  it("appends sitemap line when missing", (): void => {
    expect(appendSitemapDirective("https://a.example", "User-agent: *")).toContain(
      "Sitemap: https://a.example/sitemap.xml"
    )
  })
})
