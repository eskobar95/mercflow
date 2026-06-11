import { createRequire } from "node:module"
import path from "node:path"

import { defineConfig } from "vitest/config"

const workspaceRoot = path.resolve(__dirname, "../..")

const requireFromBackend = createRequire(path.join(workspaceRoot, "apps/backend/package.json"))

export default defineConfig({
  resolve: {
    alias: {
      "@medusajs/framework/utils": requireFromBackend.resolve("@medusajs/framework/utils"),
      "@medusajs/framework/http": requireFromBackend.resolve("@medusajs/framework/http"),
      "@medusajs/utils": requireFromBackend.resolve("@medusajs/utils"),
      "@medusajs/medusa": requireFromBackend.resolve("@medusajs/medusa"),
      "@medusajs/types": requireFromBackend.resolve("@medusajs/types"),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts", "src/**/*.test.ts"],
  },
})
