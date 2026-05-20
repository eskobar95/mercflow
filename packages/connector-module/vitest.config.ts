import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/modules/connector/encryption-service.ts"],
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
})
