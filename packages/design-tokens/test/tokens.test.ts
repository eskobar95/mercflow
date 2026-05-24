import { describe, expect, it } from "vitest"

import { buildRootStylesheet, colorTree, tokens } from "../src/index.js"

describe("design tokens", (): void => {
  it("connector status colors are defined for MercFlow admin badges", (): void => {
    expect(colorTree.connectorStatus.active.bg).toMatch(/^#[0-9a-f]{6}$/i)
    expect(colorTree.connectorStatus.unconfigured.text).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it("writes connector status vars to CSS with --mf-color-connectorStatus-* keys", (): void => {
    const css = buildRootStylesheet()
    expect(css).toContain("--mf-color-connectorStatus-active-bg:")
    expect(css).toContain("--mf-color-connectorStatus-unconfigured-text:")
  })

  it("exposes aggregate token map with color subtree", (): void => {
    expect(tokens.color).toBe(colorTree)
  })
})
