import { defineConfig, loadEnv } from "@medusajs/framework/utils"
loadEnv(process.env.NODE_ENV || "development", process.cwd())
const workerMode = process.env.MEDUSA_WORKER_MODE
export default defineConfig({
  admin: { disable: true },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: workerMode === "server" || workerMode === "worker" || workerMode === "shared" ? workerMode : "worker",
    http: {
      storeCors: process.env.STORE_CORS ?? "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS ?? "http://localhost:7001",
      authCors: process.env.AUTH_CORS ?? "http://localhost:7001",
      jwtSecret: process.env.JWT_SECRET ?? "supersecret",
      cookieSecret: process.env.COOKIE_SECRET ?? "supersecret",
    },
  },
  modules: [
    { resolve: "@medusajs/tenancy-core" },
    { resolve: "@mercflow/connector-module" },
    { resolve: "@mercflow/subscription-module" },
    { resolve: "@mercflow/notification-module" },
  ],
})