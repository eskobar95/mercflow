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
  zIndex,
} from "../definitions/batch1.js"
import { flattenRootStringTree } from "./flattenTree.js"

function linesForFlatPrefix(
  entries: Array<[string, string]>,
  varPrefix: string
): string[] {
  return entries.map(
    ([key, value]) => `  ${varPrefix}${key}: ${value};`
  )
}

/**
 * Renders a `:root { ... }` stylesheet string with all Batch 1 custom properties.
 */
export function buildRootStylesheet(): string {
  const colorLines = linesForFlatPrefix(
    flattenRootStringTree(
      colorTree as unknown as Record<string, unknown>
    ),
    "--color-"
  )

  const spacingLines = Object.entries(spacingScale).map(
    ([k, v]) => `  --spacing-${k.replace(".", "-")}: ${v};`
  )

  const fontFamilyLines = Object.entries(fontFamily).map(
    ([k, v]) => `  --font-family-${k}: ${v};`
  )
  const fontSizeLines = Object.entries(fontSize).map(
    ([k, v]) => `  --font-size-${k}: ${v};`
  )
  const fontWeightLines = Object.entries(fontWeight).map(
    ([k, v]) => `  --font-weight-${k}: ${v};`
  )
  const lineHeightLines = Object.entries(lineHeight).map(
    ([k, v]) => `  --line-height-${k}: ${v};`
  )
  const letterSpacingLines = Object.entries(letterSpacing).map(
    ([k, v]) => `  --letter-spacing-${k}: ${v};`
  )
  const radiiLines = Object.entries(radii).map(
    ([k, v]) => `  --radius-${k}: ${v};`
  )
  const shadowLines = Object.entries(shadows).map(
    ([k, v]) => `  --shadow-${k}: ${v};`
  )
  const zIndexLines = Object.entries(zIndex).map(
    ([k, v]) => `  --z-${k}: ${v};`
  )
  const motionLines = linesForFlatPrefix(
    flattenRootStringTree(motion as unknown as Record<string, unknown>),
    "--motion-"
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
