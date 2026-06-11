import pg from "pg"

let pool: pg.Pool | null = null

export type PlatformDbRoleInfo = {
  configured: true
  role: string
  bypassrls: boolean
}

export type PlatformDbUnconfigured = {
  configured: false
}

export function isPlatformDbConfigured(): boolean {
  return Boolean(process.env.PLATFORM_DATABASE_URL?.trim())
}

export function getPlatformDbPool(): pg.Pool {
  const connectionString = process.env.PLATFORM_DATABASE_URL?.trim()
  if (!connectionString) {
    throw new Error("PLATFORM_DATABASE_URL is not configured")
  }

  pool ??= new pg.Pool({ connectionString })
  return pool
}

export async function closePlatformDbPool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

export async function getPlatformDbRoleInfo(): Promise<PlatformDbRoleInfo> {
  const client = await getPlatformDbPool().connect()

  try {
    const result = await client.query<{
      role: string
      bypassrls: boolean
    }>(
      `SELECT current_user AS role, rolbypassrls AS bypassrls
       FROM pg_roles
       WHERE rolname = current_user`,
    )

    const row = result.rows[0]
    return {
      configured: true,
      role: row?.role ?? "unknown",
      bypassrls: row?.bypassrls ?? false,
    }
  } finally {
    client.release()
  }
}
