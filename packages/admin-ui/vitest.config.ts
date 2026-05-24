/// <reference types="vitest" />

import path from "node:path"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

/**
 * Admin UI Vitest workspace: JSX + `@/` alias parity with `vite.config.ts`.
 * Playwright specs live in `e2e/` and run via `pnpm test:e2e`, not Vitest.
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
    setupFiles: ["./vitest-setup.ts", "test/setup.ts"],
    exclude: ["e2e/**", "**/node_modules/**", "**/dist/**"],
    server: {
      deps: {
        inline: ["@testing-library/react"],
      },
    },
    env: {
      VITE_MEDUSA_ADMIN_BACKEND_URL: "http://localhost:9000",
    },
  },
})
