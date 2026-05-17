import { mercflowTailwindPreset } from "@mercflow/design-tokens/tailwind-preset"
import type { Config } from "tailwindcss"

/**
 * MercFlow admin: foundational theme extensions live in `@mercflow/design-tokens` Tailwind preset
 * so utilities resolve to `--mf-*` CSS custom properties.
 */
const config: Config = {
  presets: [mercflowTailwindPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
}

export default config
