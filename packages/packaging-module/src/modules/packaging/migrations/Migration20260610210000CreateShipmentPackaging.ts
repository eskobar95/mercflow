import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T054 / PRD-fulfillment-intelligence M011 OQ-01 — persist confirmed packaging per fulfillment with dimension snapshot.
 * Changes: shipment_packaging table with store_id, fulfillment_id, packaging_type_id, dimensions_snapshot_json;
 *   unique (store_id, fulfillment_id) where deleted_at IS NULL; RLS policy shipment_packaging_tenant_isolation.
 * Reversible: Yes — down() drops policy and table
 * Fields derived from: .factory/planning/tasks.md T054, PRD-fulfillment-intelligence.md OQ-01
 */
export class Migration20260610210000CreateShipmentPackaging extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "shipment_packaging" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"fulfillment_id" text not null, ` +
        `"packaging_type_id" text not null, ` +
        `"dimensions_snapshot_json" jsonb not null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "shipment_packaging_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipment_packaging_store_id" ON "shipment_packaging" ("store_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipment_packaging_deleted_at" ON "shipment_packaging" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shipment_packaging_store_fulfillment" ` +
        `ON "shipment_packaging" ("store_id", "fulfillment_id") ` +
        `WHERE deleted_at IS NULL;`
    )

    this.addSql(`ALTER TABLE "shipment_packaging" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "shipment_packaging" FORCE ROW LEVEL SECURITY;`)
    this.addSql(`DROP POLICY IF EXISTS shipment_packaging_tenant_isolation ON "shipment_packaging";`)
    this.addSql(`
      CREATE POLICY shipment_packaging_tenant_isolation ON "shipment_packaging"
        USING (store_id = current_setting('app.tenant_id', true))
        WITH CHECK (store_id = current_setting('app.tenant_id', true));
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP POLICY IF EXISTS shipment_packaging_tenant_isolation ON "shipment_packaging";`)
    this.addSql(`ALTER TABLE "shipment_packaging" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "shipment_packaging" DISABLE ROW LEVEL SECURITY;`)
    this.addSql(`drop table if exists "shipment_packaging" cascade;`)
  }
}
