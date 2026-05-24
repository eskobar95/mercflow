import path from "node:path"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

/**
 * Playwright specs live in `e2e/*.spec.ts` and are executed via `playwright test`, not Vitest.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    exclude: ["e2e/**", "**/node_modules/**", "**/dist/**"],
  },
})
