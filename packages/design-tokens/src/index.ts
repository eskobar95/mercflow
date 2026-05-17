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
} from "./definitions/batch1.js"

export { buildRootStylesheet } from "./lib/buildRootStylesheet.js"
export { tailwindPreset } from "./tailwind-preset.js"

/**
 * Authoritative nested token map for programmatic consumption (Tailwind, runtime theme, etc.).
 * Color literals live only in `definitions/batch1` and this object references them.
 */
export const tokens = {
  color: colorTree,
  spacing: spacingScale,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  motion,
  radius: radii,
  shadow: shadows,
  zIndex,
} as const

export type MercflowTokenMap = typeof tokens

export {
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
} from "./definitions/batch1.js"
