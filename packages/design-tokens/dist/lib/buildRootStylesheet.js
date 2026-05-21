import { colorTree, fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, motion, radii, shadows, spacingScale, zIndex, } from "../definitions/batch1.js";
import { flattenRootStringTree } from "./flattenTree.js";
function linesForFlatPrefix(entries, varPrefix) {
    return entries.map(([key, value]) => `  ${varPrefix}${key}: ${value};`);
}
/**
 * Renders a `:root { ... }` stylesheet string with all Batch 1 custom properties.
 */
export function buildRootStylesheet() {
    const colorLines = linesForFlatPrefix(flattenRootStringTree(colorTree), "--mf-color-");
    const spacingLines = Object.entries(spacingScale).map(([k, v]) => `  --mf-spacing-${k.replace(".", "-")}: ${v};`);
    const fontFamilyLines = Object.entries(fontFamily).map(([k, v]) => `  --mf-font-family-${k}: ${v};`);
    const fontSizeLines = Object.entries(fontSize).map(([k, v]) => `  --mf-font-size-${k}: ${v};`);
    const fontWeightLines = Object.entries(fontWeight).map(([k, v]) => `  --mf-font-weight-${k}: ${v};`);
    const lineHeightLines = Object.entries(lineHeight).map(([k, v]) => `  --mf-line-height-${k}: ${v};`);
    const letterSpacingLines = Object.entries(letterSpacing).map(([k, v]) => `  --mf-letter-spacing-${k}: ${v};`);
    const radiiLines = Object.entries(radii).map(([k, v]) => `  --mf-radius-${k}: ${v};`);
    const shadowLines = Object.entries(shadows).map(([k, v]) => `  --mf-shadow-${k}: ${v};`);
    const zIndexLines = Object.entries(zIndex).map(([k, v]) => `  --mf-z-${k}: ${v};`);
    const motionLines = linesForFlatPrefix(flattenRootStringTree(motion), "--mf-motion-");
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
    ].join("\n");
    return `:root {\n${body}\n}\n`;
}
