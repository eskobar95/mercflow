import path from "node:path"

import { defineConfig } from "vitest/config"

/**
 * Playwright specs live in `e2e/*.spec.ts` and are executed via `playwright test`, not Vitest.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["e2e/**", "**/node_modules/**", "**/dist/**"],
  },
})
