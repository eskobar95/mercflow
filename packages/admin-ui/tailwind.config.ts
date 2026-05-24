import type { Config } from "tailwindcss"

import { tailwindPreset } from "@mercflow/design-tokens/tailwind-preset"

/**
 * MercFlow admin: foundational colors/spacing/fonts resolve via the shared Tailwind preset
 * (`@mercflow/design-tokens`) to `--mf-*` custom properties emitted in `mercflow-tokens.css`.
 * Connector badges use additive palette keys not present in the base preset shell.
 */
const config: Config = {
  presets: [tailwindPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        connectorStatus: {
          active: {
            bg: "var(--mf-color-connectorStatus-active-bg)",
            border: "var(--mf-color-connectorStatus-active-border)",
            text: "var(--mf-color-connectorStatus-active-text)",
          },
          inactive: {
            bg: "var(--mf-color-connectorStatus-inactive-bg)",
            border: "var(--mf-color-connectorStatus-inactive-border)",
            text: "var(--mf-color-connectorStatus-inactive-text)",
          },
          unconfigured: {
            bg: "var(--mf-color-connectorStatus-unconfigured-bg)",
            border: "var(--mf-color-connectorStatus-unconfigured-border)",
            text: "var(--mf-color-connectorStatus-unconfigured-text)",
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
