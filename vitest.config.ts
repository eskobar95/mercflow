import { defineConfig } from "vitest/config"

/**
 * Each package has its own `vitest.config.ts` (resolve aliases, excludes, env).
 * Use project directory strings so Vitest merges the local config.
 */
export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      "packages/design-tokens",
      "packages/content-module",
      "packages/feed-module",
      "packages/inventory-module",
      "packages/subscription-module",
      "packages/connector-module",
      "apps/backend",
      "packages/admin-ui",
    ],
  },
})
