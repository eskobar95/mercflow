import { expect, it, describe } from "vitest"

import {
  buildRootStylesheet,
  colorTree,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  radii,
  shadows,
  spacingScale,
  zIndex,
  motion,
  tokens,
} from "../src/index.js"
import { tailwindPreset } from "../src/tailwind-preset.js"

describe("colorTree — surface category", () => {
  it("surface.canvas matches snapshot", () => {
    expect(colorTree.surface.canvas).toMatchInlineSnapshot(`"#fff8e8"`)
  })

  it("surface.default matches snapshot", () => {
    expect(colorTree.surface.default).toMatchInlineSnapshot(`"#fffdf1"`)
  })

  it("surface.subtle matches snapshot", () => {
    expect(colorTree.surface.subtle).toMatchInlineSnapshot(`"#fffbf0"`)
  })
})

describe("colorTree — content category", () => {
  it("content.primary matches snapshot", () => {
    expect(colorTree.content.primary).toMatchInlineSnapshot(`"#562f00"`)
  })

  it("content.secondary matches snapshot", () => {
    expect(colorTree.content.secondary).toMatchInlineSnapshot(`"#8a5220"`)
  })

  it("content.danger matches snapshot", () => {
    expect(colorTree.content.danger).toMatchInlineSnapshot(`"#b83010"`)
  })
})

describe("colorTree — border category", () => {
  it("border.default matches snapshot", () => {
    expect(colorTree.border.default).toMatchInlineSnapshot(`"#e8d0a8"`)
  })

  it("border.focus matches snapshot", () => {
    expect(colorTree.border.focus).toMatchInlineSnapshot(`"#ff9644"`)
  })
})

describe("colorTree — interactive category", () => {
  it("interactive.primary.default matches snapshot", () => {
    expect(colorTree.interactive.primary.default).toMatchInlineSnapshot(
      `"#ff9644"`
    )
  })

  it("interactive.danger.default matches snapshot", () => {
    expect(colorTree.interactive.danger.default).toMatchInlineSnapshot(
      `"#b83010"`
    )
  })
})

describe("spacing scale", () => {
  it("spacing scale has expected key count", () => {
    expect(Object.keys(spacingScale)).toMatchInlineSnapshot(`
      [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "14",
        "16",
        "20",
        "24",
        "32",
        "px",
        "0.5",
        "1.5",
        "2.5",
        "3.5",
      ]
    `)
  })

  it("spacing-4 equals 1rem", () => {
    expect(spacingScale["4"]).toMatchInlineSnapshot(`"1rem"`)
  })

  it("spacing-8 equals 2rem", () => {
    expect(spacingScale["8"]).toMatchInlineSnapshot(`"2rem"`)
  })
})

describe("typography tokens", () => {
  it("fontFamily.sans contains Inter", () => {
    expect(fontFamily.sans).toContain("Inter")
  })

  it("fontSize.base matches snapshot", () => {
    expect(fontSize.base).toMatchInlineSnapshot(`"0.875rem"`)
  })

  it("fontWeight.semibold matches snapshot", () => {
    expect(fontWeight.semibold).toMatchInlineSnapshot(`"600"`)
  })

  it("lineHeight.normal matches snapshot", () => {
    expect(lineHeight.normal).toMatchInlineSnapshot(`"1.5"`)
  })

  it("letterSpacing.tight matches snapshot", () => {
    expect(letterSpacing.tight).toMatchInlineSnapshot(`"-0.01em"`)
  })
})

describe("radii tokens", () => {
  it("radii.md matches snapshot", () => {
    expect(radii.md).toMatchInlineSnapshot(`"0.375rem"`)
  })

  it("radii.full matches snapshot", () => {
    expect(radii.full).toMatchInlineSnapshot(`"9999px"`)
  })
})

describe("shadow tokens", () => {
  it("shadows.sm matches snapshot", () => {
    expect(shadows.sm).toMatchInlineSnapshot(
      `"0 1px 2px rgba(86, 47, 0, 0.08), 0 0 0 1px rgba(86, 47, 0, 0.04)"`
    )
  })

  it("shadows.focus matches snapshot", () => {
    expect(shadows.focus).toMatchInlineSnapshot(
      `"0 0 0 3px rgba(255, 150, 68, 0.40)"`
    )
  })
})

describe("z-index tokens", () => {
  it("zIndex.modal matches snapshot", () => {
    expect(zIndex.modal).toMatchInlineSnapshot(`"1050"`)
  })

  it("zIndex.toast matches snapshot", () => {
    expect(zIndex.toast).toMatchInlineSnapshot(`"1080"`)
  })
})

describe("motion tokens", () => {
  it("motion.duration.page matches snapshot", () => {
    expect(motion.duration.page).toMatchInlineSnapshot(`"200ms"`)
  })

  it("motion.easing.page matches snapshot", () => {
    expect(motion.easing.page).toMatchInlineSnapshot(
      `"cubic-bezier(0.2, 0, 0, 1)"`
    )
  })
})

describe("tokens aggregate map", () => {
  it("tokens.color is the colorTree", () => {
    expect(tokens.color).toBe(colorTree)
  })

  it("tokens map has all expected top-level keys", () => {
    expect(Object.keys(tokens)).toMatchInlineSnapshot(`
      [
        "color",
        "spacing",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "lineHeight",
        "letterSpacing",
        "motion",
        "radius",
        "shadow",
        "zIndex",
      ]
    `)
  })
})

describe("buildRootStylesheet — --mf-* prefix convention", () => {
  const css = buildRootStylesheet()

  it("stylesheet contains :root block", () => {
    expect(css).toContain(":root {")
  })

  it("color vars use --mf-color- prefix", () => {
    expect(css).toContain("--mf-color-surface-canvas: #fff8e8;")
  })

  it("spacing vars use --mf-spacing- prefix", () => {
    expect(css).toContain("--mf-spacing-4: 1rem;")
  })

  it("font-size vars use --mf-font-size- prefix", () => {
    expect(css).toContain("--mf-font-size-base: 0.875rem;")
  })

  it("font-weight vars use --mf-font-weight- prefix", () => {
    expect(css).toContain("--mf-font-weight-semibold: 600;")
  })

  it("radius vars use --mf-radius- prefix", () => {
    expect(css).toContain("--mf-radius-md: 0.375rem;")
  })

  it("shadow vars use --mf-shadow- prefix", () => {
    expect(css).toContain("--mf-shadow-sm:")
  })

  it("z-index vars use --mf-z- prefix", () => {
    expect(css).toContain("--mf-z-modal: 1050;")
  })

  it("motion vars use --mf-motion- prefix", () => {
    expect(css).toContain("--mf-motion-duration-page: 200ms;")
  })

  it("no legacy un-prefixed vars present (e.g. --color- without --mf-)", () => {
    // Ensure old naming convention is absent
    expect(css).not.toMatch(/^\s*--color-/m)
    expect(css).not.toMatch(/^\s*--spacing-/m)
    expect(css).not.toMatch(/^\s*--radius-/m)
  })
})

describe("tailwindPreset — CSS var references", () => {
  it("preset has theme.extend shape", () => {
    expect(tailwindPreset).toHaveProperty("theme.extend")
  })

  it("surface DEFAULT maps to --mf-color-surface-default CSS var", () => {
    const { colors } = tailwindPreset.theme.extend
    expect((colors.surface as Record<string, string>).DEFAULT).toBe(
      "var(--mf-color-surface-default)"
    )
  })

  it("surface canvas maps to --mf-color-surface-canvas CSS var", () => {
    const { colors } = tailwindPreset.theme.extend
    expect((colors.surface as Record<string, string>).canvas).toBe(
      "var(--mf-color-surface-canvas)"
    )
  })

  it("content primary maps to --mf-color-content-primary CSS var", () => {
    const { colors } = tailwindPreset.theme.extend
    expect((colors.content as Record<string, string>).primary).toBe(
      "var(--mf-color-content-primary)"
    )
  })

  it("spacing 4 maps to --mf-spacing-4 CSS var", () => {
    expect(tailwindPreset.theme.extend.spacing["4"]).toBe(
      "var(--mf-spacing-4)"
    )
  })

  it("borderRadius DEFAULT maps to --mf-radius-md CSS var", () => {
    expect(tailwindPreset.theme.extend.borderRadius.DEFAULT).toBe(
      "var(--mf-radius-md)"
    )
  })

  it("boxShadow DEFAULT maps to --mf-shadow-md CSS var", () => {
    expect(tailwindPreset.theme.extend.boxShadow.DEFAULT).toBe(
      "var(--mf-shadow-md)"
    )
  })

  it("fontFamily sans maps to --mf-font-family-sans CSS var", () => {
    expect(tailwindPreset.theme.extend.fontFamily.sans).toBe(
      "var(--mf-font-family-sans)"
    )
  })
})
