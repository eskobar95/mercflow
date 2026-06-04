import { createRequire } from "node:module"
import { readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "../../..")

const MERCFLOW_TABLES = [
  "article",
  "category_content",
  "product_content",
] as const

const GUAPO_STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const GUAPO_STORE_B = "store_01KG0VBTT0714XV2CCTEBRVC48"

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

describe.skipIf(!dbIntegrationReady)("T001 tenancy DB integration", (): void => {
  it("has no NULL store_id on MercFlow content tables", async () => {
    const client = createPgClient()
    await client.connect()
    try {
      for (const table of MERCFLOW_TABLES) {
        const result = await client.query(
          `SELECT count(*)::int AS n FROM "${table}" WHERE store_id IS NULL`
        )
        expect(result.rows[0]?.n, table).toBe(0)
      }
    } finally {
      await client.end()
    }
  })

  it("allows duplicate (slug, locale) across store_id but not within one store", async () => {
    const client = createPgClient()
    await client.connect()
    const slug = `t001-review-${Date.now()}`
    const locale = "en"
    const idA = `t001_a_${Date.now()}`
    const idB = `t001_b_${Date.now() + 1}`

    try {
      await client.query(
        `INSERT INTO "article" (id, store_id, slug, title, locale, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'draft', now(), now())`,
        [idA, GUAPO_STORE_A, slug, "T001 A", locale]
      )
      await client.query(
        `INSERT INTO "article" (id, store_id, slug, title, locale, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'draft', now(), now())`,
        [idB, GUAPO_STORE_B, slug, "T001 B", locale]
      )

      await expect(
        client.query(
          `INSERT INTO "article" (id, store_id, slug, title, locale, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'draft', now(), now())`,
          [`t001_dup_${Date.now()}`, GUAPO_STORE_A, slug, "T001 dup", locale]
        )
      ).rejects.toThrow()
    } finally {
      await client.query(`DELETE FROM "article" WHERE id IN ($1, $2)`, [idA, idB])
      await client.end()
    }
  })
})
