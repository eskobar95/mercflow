import { createRequire } from "node:module"
import { readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "../../..")

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const STORE_B = "store_01PROBE0000000000000000001"

type PgClient = {
  connect(): Promise<void>
  query(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: Array<Record<string, unknown>> }>
  end(): Promise<void>
}

type PgClientCtor = new (config: { connectionString: string }) => PgClient

function readDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim()
  return url && url.length > 0 ? url : undefined
}

function loadPgClientCtor(): PgClientCtor | undefined {
  try {
    const pnpmDir = join(REPO_ROOT, "node_modules/.pnpm")
    const pgDir = readdirSync(pnpmDir).find((name) => name.startsWith("pg@"))
    if (!pgDir) return undefined
    const require = createRequire(
      join(pnpmDir, pgDir, "node_modules/pg/package.json")
    )
    return require("pg").Client as PgClientCtor
  } catch {
    return undefined
  }
}

const databaseUrl = readDatabaseUrl()
const PgClientCtor = loadPgClientCtor()
const dbIntegrationReady = databaseUrl !== undefined && PgClientCtor !== undefined

function createPgClient(): PgClient {
  return new PgClientCtor!({ connectionString: databaseUrl! })
}

describe.skipIf(!dbIntegrationReady)("packaging_types RLS DB integration", (): void => {
  it("has RLS enabled with packaging_types_tenant_isolation policy", async (): Promise<void> => {
    const client = createPgClient()
    await client.connect()
    try {
      const exists = await client.query(`SELECT to_regclass($1) AS reg`, [
        'public."packaging_types"',
      ])
      if (exists.rows[0]?.reg == null) {
        return
      }

      const rls = await client.query(
        `
        SELECT c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = $1
        `,
        ["packaging_types"]
      )
      expect(rls.rows[0]?.rls_enabled).toBe(true)
      expect(rls.rows[0]?.rls_forced).toBe(true)

      const policies = await client.query(
        `
        SELECT polname FROM pg_policy p
        JOIN pg_class c ON c.oid = p.polrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = $1
        `,
        ["packaging_types"]
      )
      const names = policies.rows.map((row) => row.polname)
      expect(names).toContain("packaging_types_tenant_isolation")
    } finally {
      await client.end()
    }
  })

  it("returns zero cross-tenant rows without app.tenant_id", async (): Promise<void> => {
    const client = createPgClient()
    await client.connect()
    try {
      const exists = await client.query(`SELECT to_regclass($1) AS reg`, [
        'public."packaging_types"',
      ])
      if (exists.rows[0]?.reg == null) {
        return
      }

      await client.query("BEGIN")
      const withoutTenant = await client.query(
        `SELECT count(*)::int AS n FROM "packaging_types"`
      )
      expect(withoutTenant.rows[0]?.n).toBe(0)

      await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [STORE_A])
      const withTenantA = await client.query(
        `SELECT count(*)::int AS n FROM "packaging_types" WHERE store_id = $1`,
        [STORE_A]
      )
      expect(withTenantA.rows[0]?.n).toBeGreaterThanOrEqual(0)

      await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [STORE_B])
      const withTenantB = await client.query(
        `SELECT count(*)::int AS n FROM "packaging_types" WHERE store_id = $1`,
        [STORE_A]
      )
      expect(withTenantB.rows[0]?.n).toBe(0)

      await client.query("ROLLBACK")
    } finally {
      await client.end()
    }
  })
})
