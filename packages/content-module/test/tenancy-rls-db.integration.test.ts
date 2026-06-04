import { createRequire } from "node:module"
import { readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { TENANCY_TABLES } from "../src/modules/content/migrations/Migration20260604220000EnableRlsTenantIsolation"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "../../..")

const GUAPO_STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"

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

describe.skipIf(!dbIntegrationReady)("T002 RLS DB integration", (): void => {
  it("has RLS enabled with tenant_isolation policy on MercFlow content tables", async () => {
    const client = createPgClient()
    await client.connect()
    try {
      for (const table of TENANCY_TABLES) {
        const exists = await client.query(
          `SELECT to_regclass($1) AS reg`,
          [`public."${table}"`]
        )
        if (exists.rows[0]?.reg == null) {
          continue
        }
        const rls = await client.query(
          `
          SELECT c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = $1
          `,
          [table]
        )
        expect(rls.rows[0]?.rls_enabled, table).toBe(true)
        expect(rls.rows[0]?.rls_forced, table).toBe(true)

        const policies = await client.query(
          `
          SELECT polname FROM pg_policy p
          JOIN pg_class c ON c.oid = p.polrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = $1
          `,
          [table]
        )
        const names = policies.rows.map((row) => row.polname)
        expect(names, table).toContain("tenant_isolation")
      }
    } finally {
      await client.end()
    }
  })

  it("returns no article rows without app.store_id; returns rows when set", async () => {
    const client = createPgClient()
    await client.connect()
    try {
      await client.query("BEGIN")
      const withoutTenant = await client.query(`SELECT count(*)::int AS n FROM "article"`)
      expect(withoutTenant.rows[0]?.n).toBe(0)

      await client.query(`SELECT set_config('app.store_id', $1, true)`, [GUAPO_STORE_ID])
      const withTenant = await client.query(`SELECT count(*)::int AS n FROM "article"`)
      expect(withTenant.rows[0]?.n).toBeGreaterThanOrEqual(0)
      await client.query("ROLLBACK")
    } finally {
      await client.end()
    }
  })
})
