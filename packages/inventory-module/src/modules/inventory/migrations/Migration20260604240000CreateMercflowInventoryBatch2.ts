import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: Factory S006 T020 / ADR-003, ADR-004, ADR-005 — suppliers, purchase orders, receipts, inventory config.
 * Changes:
 *   - mercflow_supplier, mercflow_purchase_order (soft-delete tables)
 *   - mercflow_purchase_order_line, mercflow_purchase_order_receipt (hard rows, no deleted_at)
 *   - mercflow_inventory_config (per-store singleton, soft-delete)
 *   - store_id NOT NULL + RLS tenant_isolation on all tables
 * Reversible: Yes — down() drops policies and tables
 * Fields derived from: .factory/planning/tasks.md T020, PRD-batch2 §3.9–3.10
 */
const TABLES_WITH_SOFT_DELETE = [
  "mercflow_supplier",
  "mercflow_purchase_order",
  "mercflow_inventory_config",
] as const

const TABLES_WITHOUT_SOFT_DELETE = [
  "mercflow_purchase_order_line",
  "mercflow_purchase_order_receipt",
] as const

export class Migration20260604240000CreateMercflowInventoryBatch2 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "mercflow_supplier" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"name" text not null, ` +
        `"contact_person" text null, ` +
        `"email" text null, ` +
        `"country" text null, ` +
        `"currency" text null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "mercflow_supplier_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_supplier_store_id" ON "mercflow_supplier" ("store_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_supplier_deleted_at" ON "mercflow_supplier" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "mercflow_purchase_order" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"supplier_id" text not null, ` +
        `"status" text not null default 'draft', ` +
        `"expected_date" timestamptz null, ` +
        `"reference" text null, ` +
        `"notes" text null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "mercflow_purchase_order_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_purchase_order_store_id" ON "mercflow_purchase_order" ("store_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_purchase_order_supplier_id" ON "mercflow_purchase_order" ("supplier_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_purchase_order_deleted_at" ON "mercflow_purchase_order" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "mercflow_purchase_order_line" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"po_id" text not null, ` +
        `"variant_id" text not null, ` +
        `"ordered_qty" numeric not null, ` +
        `"unit_cost" numeric not null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `constraint "mercflow_purchase_order_line_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_purchase_order_line_store_id" ON "mercflow_purchase_order_line" ("store_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_purchase_order_line_po_id" ON "mercflow_purchase_order_line" ("po_id");`
    )

    this.addSql(
      `create table if not exists "mercflow_purchase_order_receipt" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"line_id" text not null, ` +
        `"received_qty" numeric not null, ` +
        `"received_at" timestamptz not null, ` +
        `"notes" text null, ` +
        `constraint "mercflow_purchase_order_receipt_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_purchase_order_receipt_store_id" ON "mercflow_purchase_order_receipt" ("store_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_purchase_order_receipt_line_id" ON "mercflow_purchase_order_receipt" ("line_id");`
    )

    this.addSql(
      `create table if not exists "mercflow_inventory_config" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"low_stock_threshold" numeric not null default 5, ` +
        `"email_alerts_enabled" boolean not null default false, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "mercflow_inventory_config_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_inventory_config_store_id" ON "mercflow_inventory_config" ("store_id");`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mercflow_inventory_config_store_unique" ON "mercflow_inventory_config" ("store_id") WHERE deleted_at IS NULL;`
    )

    for (const table of TABLES_WITH_SOFT_DELETE) {
      this.enableRlsOnTable(table)
    }
    for (const table of TABLES_WITHOUT_SOFT_DELETE) {
      this.enableRlsOnTable(table)
    }
  }

  override async down(): Promise<void> {
    const all = [...TABLES_WITH_SOFT_DELETE, ...TABLES_WITHOUT_SOFT_DELETE]
    for (const table of [...all].reverse()) {
      this.disableRlsOnTable(table)
      this.addSql(`drop table if exists "${table}" cascade;`)
    }
  }

  private enableRlsOnTable(table: string): void {
    this.addSql(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`)
    this.addSql(`DROP POLICY IF EXISTS tenant_isolation ON "${table}";`)
    this.addSql(`
      CREATE POLICY tenant_isolation ON "${table}"
        USING (store_id = current_setting('app.store_id', true));
    `)
  }

  private disableRlsOnTable(table: string): void {
    this.addSql(`DROP POLICY IF EXISTS tenant_isolation ON "${table}";`)
    this.addSql(`ALTER TABLE "${table}" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`)
  }
}
