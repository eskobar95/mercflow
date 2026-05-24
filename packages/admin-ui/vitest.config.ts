/// <reference types="vitest" />

import path from "node:path"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest-setup.ts"],
    exclude: ["e2e/**", "**/node_modules/**", "**/dist/**"],
    server: {
      deps: {
        inline: ["@testing-library/react"],
      },
    },
  },
})
