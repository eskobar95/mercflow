import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { buildRootStylesheet } from "../src/lib/buildRootStylesheet.js"

const pkgDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)))

function normalizeWhitespace(css: string): string {
  return css.trim().replace(/\r\n/g, "\n").replace(/\n{2,}/g, "\n")
}

function pickLines(css: string, substring: string): string {
  return css
    .split("\n")
    .filter((line) => line.includes(substring))
    .join("\n")
}

function stylesheetFromSourceFile(): string {
  const cssPath = join(pkgDir, "src", "tokens.css")
  return readFileSync(cssPath, "utf8")
}

describe("MercFlow design tokens — snapshots", (): void => {
  it("buildRootStylesheet() full output stays stable unless tokens intentionally change", (): void => {
    const css = normalizeWhitespace(buildRootStylesheet())
    expect(css).toMatchSnapshot()
  })

  it("captures subtle brand accents", (): void => {
    expect(pickLines(buildRootStylesheet(), "--mf-color-brand")).toMatchSnapshot()
  })

  it("captures interactive affordances", (): void => {
    expect(pickLines(buildRootStylesheet(), "--mf-color-interactive")).toMatchSnapshot()
  })

  it("captures leading spacing ladder entries", (): void => {
    const lines = pickLines(buildRootStylesheet(), "--mf-spacing")
    expect(lines.split("\n").slice(0, 8).join("\n")).toMatchSnapshot()
  })

  it("captures font-size micro scale", (): void => {
    expect(pickLines(buildRootStylesheet(), "--mf-font-size")).toMatchSnapshot()
  })

  it("captures font-weight primitives", (): void => {
    expect(pickLines(buildRootStylesheet(), "--mf-font-weight")).toMatchSnapshot()
  })

  it("captures line-height ramps", (): void => {
    expect(pickLines(buildRootStylesheet(), "--mf-line-height")).toMatchSnapshot()
  })

  it("captures letter-spacing ramps", (): void => {
    expect(pickLines(buildRootStylesheet(), "--mf-letter-spacing")).toMatchSnapshot()
  })

  it("captures radii primitives", (): void => {
    expect(pickLines(buildRootStylesheet(), "--mf-radius")).toMatchSnapshot()
  })

  it("captures elevation shadows + focus halo", (): void => {
    expect(pickLines(buildRootStylesheet(), "--mf-shadow")).toMatchSnapshot()
  })

  it("captures overlay z-index ramps", (): void => {
    expect(pickLines(buildRootStylesheet(), "--mf-z-index")).toMatchSnapshot()
  })

  it("captures discrete motion choreography tokens", (): void => {
    expect(pickLines(buildRootStylesheet(), "--mf-motion")).toMatchSnapshot()
  })

  it("lists every emitted custom-property name alphabetically", (): void => {
    const css = buildRootStylesheet()
    const names = [...css.matchAll(/^\s*(--mf-[a-z0-9]+(?:-[a-z0-9]+)*):/gm)].map((m) => m[1] ?? "").filter(Boolean)
    expect([...names].sort()).toMatchSnapshot()
  })
})

describe("MercFlow design tokens — invariants", (): void => {
  it("keeps tracked src/tokens.css aligned with programmatic generator after build", (): void => {
    expect(normalizeWhitespace(stylesheetFromSourceFile())).toBe(
      normalizeWhitespace(buildRootStylesheet())
    )
  })

  it("anchors label + surface palettes to the Shopify-inspired neutrals brief", (): void => {
    const css = buildRootStylesheet()
    expect(css).toContain("--mf-color-surface-default: #ffffff")
    expect(css).toContain("--mf-color-label-primary: #202223")
  })

  it("uses only `--mf-{kebab}` CSS variables (no stray legacy prefixes)", (): void => {
    const css = buildRootStylesheet()
    expect(css).not.toContain("--color-")
    expect(css).not.toMatch(/^[^]*\s--motion-/m)
    const names = [...css.matchAll(/^\s*(--[a-z-]+):/gm)].map((m) => m[1] ?? "").filter(Boolean)
    for (const name of names) {
      expect(name.startsWith("--mf-")).toBe(true)
    }
  })
})
