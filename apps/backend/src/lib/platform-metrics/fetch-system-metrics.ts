import { fetchHetznerMetrics } from "./fetch-hetzner-metrics"
import { fetchNeonMetrics } from "./fetch-neon-metrics"
import { fetchRedisMetrics } from "./fetch-redis-metrics"

export type PlatformSystemMetrics = {
  fetched_at: string
  uptime_seconds: number
  hetzner: Awaited<ReturnType<typeof fetchHetznerMetrics>>
  neon: Awaited<ReturnType<typeof fetchNeonMetrics>>
  redis: Awaited<ReturnType<typeof fetchRedisMetrics>>
}

export async function fetchPlatformSystemMetrics(): Promise<PlatformSystemMetrics> {
  const [hetzner, neon, redis] = await Promise.all([
    fetchHetznerMetrics(),
    fetchNeonMetrics(),
    fetchRedisMetrics(),
  ])

  return {
    fetched_at: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    hetzner,
    neon,
    redis,
  }
}
