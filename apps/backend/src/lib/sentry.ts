import * as Sentry from "@sentry/node"

let initialized = false

export function initSentry(env: NodeJS.ProcessEnv = process.env): void {
  if (initialized) return
  const dsn = env.SENTRY_DSN?.trim()
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: env.SENTRY_ENVIRONMENT?.trim() || env.NODE_ENV || "development",
    enabled: env.SENTRY_ENABLED !== "false",
  })
  initialized = true
}

export function isSentryEnabled(): boolean {
  return initialized
}

export function setSentryStoreIdTag(storeId: string): void {
  if (!initialized || storeId.length === 0) return
  Sentry.getIsolationScope().setTag("store_id", storeId)
}

export { Sentry }
