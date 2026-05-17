import type { Config } from "tailwindcss"

import mercflowPreset from "@mercflow/design-tokens/tailwind-preset"

/**
 * MercFlow admin: foundational theme comes from `@mercflow/design-tokens/tailwind-preset`.
 * See `.cursor/rules/admin-ui.mdc` for naming alignment.
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  presets: [mercflowPreset],
  plugins: [],
}

export default config
