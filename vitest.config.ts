import { defineConfig } from "vitest/config"

/**
 * Each package has its own `vitest.config.ts` (resolve aliases, excludes, env).
 * Use project directory strings so Vitest merges the local config.
 */
export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      "scripts",
      "packages/design-tokens",
      "packages/shared",
      "packages/content-module",
      "packages/medusa-fork/tenancy-core",
      "packages/feed-module",
      "packages/inventory-module",
      "packages/packaging-module",
      "packages/notification-module",
      "packages/seo-module",
      "packages/subscription-module",
      "packages/connector-module",
      "apps/backend",
      "apps/worker",
      "packages/admin-ui",
    ],
  },
})
