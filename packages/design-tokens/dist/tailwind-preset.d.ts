/**
 * Tailwind CSS v3 preset for MercFlow.
 *
 * Maps semantic utility classes to CSS custom properties from mercflow-tokens.css.
 * Downstream packages include this preset in their tailwind.config.ts.
 *
 * Usage:
 *   import { tailwindPreset } from "@mercflow/design-tokens"
 *   export default { presets: [tailwindPreset], ... }
 */
type TailwindColorMap = Record<string, string | Record<string, string>>;
export declare const tailwindPreset: {
    readonly theme: {
        readonly extend: {
            readonly colors: Record<string, TailwindColorMap>;
            readonly spacing: Record<string, string>;
            readonly fontFamily: Record<string, string>;
            readonly fontSize: Record<string, string>;
            readonly fontWeight: Record<string, string>;
            readonly lineHeight: Record<string, string>;
            readonly letterSpacing: Record<string, string>;
            readonly borderRadius: Record<string, string>;
            readonly boxShadow: Record<string, string>;
            readonly zIndex: Record<string, string>;
        };
    };
};
export {};
//# sourceMappingURL=tailwind-preset.d.ts.map