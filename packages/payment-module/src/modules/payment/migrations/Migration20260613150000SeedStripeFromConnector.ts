import { createRequire } from "node:module"

import { Migration } from "@medusajs/framework/mikro-orm/migrations"

import { migrateConnectorStripeCredentials } from "../migrate-connector-stripe-credentials"

const require = createRequire(import.meta.url)

type PgQueryResult = { rows: unknown[] }

type PgClient = {
  connect: () => Promise<void>
  query: (text: string, values?: unknown[]) => Promise<PgQueryResult>
  end: () => Promise<void>
}

type PgClientCtor = new (config: { connectionString: string }) => PgClient

function createMigrationConnection(client: PgClient) {
  return (table: string) => ({
    select: (...columns: string[]) => ({
      where: (filter: Record<string, unknown>) => ({
        whereNull: (column: string) => ({
          limit: async (count: number): Promise<unknown[]> => {
            const keys = Object.keys(filter)
            const conditions = keys.map((key, index) => `"${key}" = $${index + 1}`)
            conditions.push(`"${column}" IS NULL`)
            const sql = `SELECT ${columns.map((c) => `"${c}"`).join(", ")} FROM "${table}" WHERE ${conditions.join(" AND ")} LIMIT ${count}`
            const result = await client.query(sql, Object.values(filter))
            return result.rows
          },
        }),
      }),
      limit: async (count: number): Promise<unknown[]> => {
        const sql = `SELECT ${columns.map((c) => `"${c}"`).join(", ")} FROM "${table}" LIMIT ${count}`
        const result = await client.query(sql)
        return result.rows
      },
    }),
    insert: async (row: Record<string, unknown>): Promise<unknown> => {
      const keys = Object.keys(row)
      const placeholders = keys.map((_, index) => `$${index + 1}`)
      const sql = `INSERT INTO "${table}" (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${placeholders.join(", ")})`
      await client.query(sql, keys.map((key) => row[key]))
      return undefined
    },
  })
}

/**
 * MIGRATION DECISION LOG
 * Reason: T080 / ADR-013 — copy legacy payment connector credentials into payment_provider_config.
 * Changes: Seeds payment_provider_config rows from connector_config legacy payment rows.
 * Reversible: Yes — down() deletes rows inserted by this migration.
 */
export class Migration20260613150000SeedStripeFromConnector extends Migration {
  override async up(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL?.trim()
    if (databaseUrl === undefined || databaseUrl === "") {
      return
    }

    let PgClient: PgClientCtor
    try {
      PgClient = require("pg").Client as PgClientCtor
    } catch {
      return
    }

    const client = new PgClient({ connectionString: databaseUrl })
    await client.connect()
    try {
      await migrateConnectorStripeCredentials(createMigrationConnection(client))
    } finally {
      await client.end()
    }
  }

  override async down(): Promise<void> {
    this.addSql(
      `DELETE FROM "payment_provider_config" WHERE "provider" = 'stripe' AND "id" LIKE 'ppc_%';`
    )
  }
}
