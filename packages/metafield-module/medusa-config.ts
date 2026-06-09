import { defineConfig, loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const config = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS ?? "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS ?? "http://localhost:7001",
      authCors: process.env.AUTH_CORS ?? "http://localhost:7001",
      jwtSecret: process.env.JWT_SECRET ?? "supersecret",
      cookieSecret: process.env.COOKIE_SECRET ?? "supersecret",
    },
  },
  modules: [
    {
      resolve: "./src/modules/metafield",
    },
  ],
})

/**
 * Minimal Medusa project root for local migration tooling.
 * Production apps register `@mercflow/metafield-module` from `apps/backend/medusa-config`.
 */
export default config
