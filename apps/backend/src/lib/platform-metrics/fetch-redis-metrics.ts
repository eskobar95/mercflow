import IORedis from "ioredis"

export type RedisMetricsSnapshot = {
  configured: boolean
  used_memory_bytes: number | null
  max_memory_bytes: number | null
  error: string | null
}

function parseInfoNumber(info: string, key: string): number | null {
  const match = new RegExp(`^${key}:(\\d+)`, "m").exec(info)
  if (!match) {
    return null
  }
  const value = Number(match[1])
  return Number.isFinite(value) ? value : null
}

export async function fetchRedisMetrics(): Promise<RedisMetricsSnapshot> {
  const redisUrl = process.env.REDIS_URL?.trim()
  if (!redisUrl) {
    return {
      configured: false,
      used_memory_bytes: null,
      max_memory_bytes: null,
      error: null,
    }
  }

  const client = new IORedis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    lazyConnect: true,
  })

  try {
    await client.connect()
    const info = await client.info("memory")
    const usedMemory = parseInfoNumber(info, "used_memory")
    const maxMemory = parseInfoNumber(info, "maxmemory")

    return {
      configured: true,
      used_memory_bytes: usedMemory,
      max_memory_bytes: maxMemory === 0 ? null : maxMemory,
      error: null,
    }
  } catch (error) {
    return {
      configured: true,
      used_memory_bytes: null,
      max_memory_bytes: null,
      error:
        error instanceof Error ? error.message : "Failed to fetch Redis metrics",
    }
  } finally {
    client.disconnect()
  }
}
