import { colorTree, fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, radii, shadows, spacingScale, zIndex, } from "./definitions/batch1.js";
export { buildRootStylesheet } from "./lib/buildRootStylesheet.js";
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
    radius: radii,
    shadow: shadows,
    zIndex,
};
export { colorTree, fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, radii, shadows, spacingScale, zIndex, } from "./definitions/batch1.js";
