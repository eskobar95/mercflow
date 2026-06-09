import { describe, expect, it } from "vitest"

import {
  GUAPO_BACKFILL_STORE_ID,
  M0_CORE_TABLES,
} from "../src/modules/tenancy-core/core-tables-constants"
import { Migration20260609120000CoreTablesStoreIdRls } from "../src/modules/tenancy-core/migrations/Migration20260609120000CoreTablesStoreIdRls"

type MigrationSqlCapture = {
  sql: string[]
  addSql: (statement: string) => void
}

function captureMigrationSql(
  migration: Migration20260609120000CoreTablesStoreIdRls,
  method: "up" | "down",
): string[] {
  const capture: MigrationSqlCapture = { sql: [], addSql(statement: string) {
    capture.sql.push(statement.trim())
  } }
  Object.assign(migration, capture)
  migration[method]()
  return capture.sql
}

describe("T036 core tables store_id + RLS migration", (): void => {
  it("targets all six M0 core tables including order_line_item", (): void => {
    expect(M0_CORE_TABLES).toEqual([
      "product",
      "product_variant",
      "product_category",
      "order",
      "customer",
      "order_line_item",
    ])
    expect(M0_CORE_TABLES).not.toContain("line_item")
  })

  it("up() backfills Guapo store_id, enables RLS with USING + WITH CHECK, and adds triggers", (): void => {
    const migration = new Migration20260609120000CoreTablesStoreIdRls()
    const statements = captureMigrationSql(migration, "up")
    const joined = statements.join("\n")

    expect(joined).toContain(GUAPO_BACKFILL_STORE_ID)
    expect(joined).toContain("mercflow_set_store_id_from_tenant_id")
    expect(joined).toContain("BEFORE INSERT OR UPDATE")

    for (const table of M0_CORE_TABLES) {
      expect(joined).toContain(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "store_id"`)
      expect(joined).toContain(`CREATE INDEX IF NOT EXISTS "IDX_${table}_store_id"`)
      expect(joined).toContain(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)
      expect(joined).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`)
      expect(joined).toContain(`CREATE POLICY tenant_isolation ON "${table}"`)
      expect(joined).toContain(`trg_${table}_set_store_id_from_tenant`)
    }

    expect(joined).toContain(
      "USING (store_id = current_setting('app.tenant_id', true))",
    )
    expect(joined).toContain(
      "WITH CHECK (store_id = current_setting('app.tenant_id', true))",
    )
  })

  it("down() reverses triggers, RLS, indexes, and store_id columns", (): void => {
    const migration = new Migration20260609120000CoreTablesStoreIdRls()
    const statements = captureMigrationSql(migration, "down")
    const joined = statements.join("\n")

    expect(joined).toContain('DROP FUNCTION IF EXISTS "mercflow_set_store_id_from_tenant_id"')

    for (const table of M0_CORE_TABLES) {
      expect(joined).toContain(`DROP TRIGGER IF EXISTS "trg_${table}_set_store_id_from_tenant"`)
      expect(joined).toContain(`DROP POLICY IF EXISTS tenant_isolation ON "${table}"`)
      expect(joined).toContain(`DROP INDEX IF EXISTS "IDX_${table}_store_id"`)
      expect(joined).toContain(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "store_id"`)
    }
  })
})
