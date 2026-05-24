import type { Config } from "tailwindcss"

import { tailwindPreset } from "@mercflow/design-tokens"

/**
 * MercFlow admin: foundational color, radius, shadow, and spacing values
 * come from `@mercflow/design-tokens` tailwind preset (maps to --mf-* CSS vars).
 */
const config: Config = {
  presets: [tailwindPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
}

export default config
