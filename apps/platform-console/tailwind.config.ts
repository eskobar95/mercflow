import type { Config } from "tailwindcss"

import { tailwindPreset } from "@mercflow/design-tokens/tailwind-preset"

const config: Config = {
  presets: [tailwindPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  plugins: [],
}

export default config
