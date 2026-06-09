import { defineConfig, loadEnv } from "@medusajs/framework/utils"

import "./src/instrumentation"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const workerMode = process.env.MEDUSA_WORKER_MODE

export default defineConfig({
  admin: {
    disable: true,
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode:
      workerMode === "server" || workerMode === "worker" || workerMode === "shared"
        ? workerMode
        : "shared",
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
      resolve: "@mercflow/content-module",
    },
    {
      resolve: "@mercflow/connector-module",
    },
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/fulfillment-manual",
            id: "manual",
          },
          {
            resolve: "@mercflow/connector-module/mercflow-shipmondo-fulfillment-provider",
            id: "mercflow-shipmondo",
          },
        ],
      },
    },
    {
      resolve: "@mercflow/subscription-module",
    },
    {
      resolve: "@mercflow/feed-module",
    },
    {
      resolve: "@mercflow/inventory-module",
    },
    {
      resolve: "@mercflow/seo-module",
    },
  ],
})
