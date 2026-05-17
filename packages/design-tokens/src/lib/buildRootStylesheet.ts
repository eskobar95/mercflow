import {
  colorTree,
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  motion,
  radii,
  shadows,
  spacingScale,
  spacingScaleOrder,
  zIndex,
} from "../definitions/batch1.js"
import { flattenRootStringTree } from "./flattenTree.js"

/** Convert camelCase token keys (e.g. modalBackdrop) to kebab-case for CSS identifiers. */
function toKebabCase(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
}

function linesForFlatPrefix(
  entries: Array<[string, string]>,
  varPrefix: string
): string[] {
  return entries.map(([key, value]) => `  ${varPrefix}${key}: ${value};`)
}

function linesForSpacing(): string[] {
  return spacingScaleOrder.map((key) => {
    const val = spacingScale[key]
    return `  --mf-spacing-${String(key).replace(".", "-")}: ${val};`
  })
}

function linesFromRecord(record: Record<string, string>, group: string): string[] {
  return Object.entries(record).map(([k, v]) => {
    const key = group === "z-index" ? toKebabCase(k) : k.replace(".", "-")
    return `  --mf-${group}-${key}: ${v};`
  })
}

function linesMotion(entries: Array<[string, string]>): string[] {
  return entries.map(([key, value]) => `  --mf-motion-${key}: ${value};`)
}

/**
 * Renders a `:root { ... }` stylesheet with MercFlow `--mf-{category}-{...}` variables.
 */
export function buildRootStylesheet(): string {
  const colorLines = linesForFlatPrefix(
    flattenRootStringTree(colorTree as unknown as Record<string, unknown>),
    "--mf-color-"
  )

  const spacingLines = linesForSpacing()

  const fontFamilyLines = Object.entries(fontFamily).map(
    ([k, v]) => `  --mf-font-family-${k}: ${v};`
  )
  const fontSizeLines = Object.entries(fontSize).map(
    ([k, v]) => `  --mf-font-size-${k}: ${v};`
  )
  const fontWeightLines = Object.entries(fontWeight).map(
    ([k, v]) => `  --mf-font-weight-${k}: ${v};`
  )
  const lineHeightLines = Object.entries(lineHeight).map(
    ([k, v]) => `  --mf-line-height-${k}: ${v};`
  )
  const letterSpacingLines = Object.entries(letterSpacing).map(
    ([k, v]) => `  --mf-letter-spacing-${k}: ${v};`
  )
  const radiiLines = Object.entries(radii).map(
    ([k, v]) => `  --mf-radius-${k}: ${v};`
  )
  const shadowLines = Object.entries(shadows).map(
    ([k, v]) => `  --mf-shadow-${k}: ${v};`
  )
  const zIndexLines = linesFromRecord(zIndex as Record<string, string>, "z-index")

  const motionLines = linesMotion(
    flattenRootStringTree(motion as unknown as Record<string, unknown>)
  )

  const body = [
    ...colorLines,
    ...spacingLines,
    ...fontFamilyLines,
    ...fontSizeLines,
    ...fontWeightLines,
    ...lineHeightLines,
    ...letterSpacingLines,
    ...radiiLines,
    ...shadowLines,
    ...zIndexLines,
    ...motionLines,
  ].join("\n")

  return `:root {\n${body}\n}\n`
}
