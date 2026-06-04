const DEFAULT_PUBLIC_RPM = 60
const DEFAULT_STORE_RPM = 300
const DEFAULT_RETRY_AFTER_SECONDS = 60
const DEFAULT_WINDOW_MS = 60_000

export type RateLimitConfig = {
  publicRpm: number
  storeRpm: number
  retryAfterSeconds: number
  windowMs: number
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

export function loadRateLimitConfig(
  env: NodeJS.ProcessEnv = process.env,
): RateLimitConfig {
  return {
    publicRpm: parsePositiveInt(env.RATE_LIMIT_PUBLIC_RPM, DEFAULT_PUBLIC_RPM),
    storeRpm: parsePositiveInt(env.RATE_LIMIT_STORE_RPM, DEFAULT_STORE_RPM),
    retryAfterSeconds: DEFAULT_RETRY_AFTER_SECONDS,
    windowMs: DEFAULT_WINDOW_MS,
  }
}
