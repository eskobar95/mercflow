import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T050 / PRD-fulfillment-intelligence M010 — tenant packaging catalog for fulfillment suggestions.
 * Changes: packaging_types table with store_id, dimensions (mm), max_weight_g, type enum, soft delete;
 *   unique (store_id, name) where deleted_at IS NULL; RLS policy packaging_types_tenant_isolation.
 * Reversible: Yes — down() drops policy and table
 * Fields derived from: .factory/planning/tasks.md T050, PRD-fulfillment-intelligence.md
 */
export class Migration20260610200000CreatePackagingTypes extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "packaging_types" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"name" text not null, ` +
        `"type" text not null, ` +
        `"length_mm" integer not null, ` +
        `"width_mm" integer not null, ` +
        `"height_mm" integer not null, ` +
        `"max_weight_g" integer not null, ` +
        `"is_active" boolean not null default true, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "packaging_types_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_packaging_types_store_id" ON "packaging_types" ("store_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_packaging_types_deleted_at" ON "packaging_types" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_packaging_types_store_name" ` +
        `ON "packaging_types" ("store_id", "name") ` +
        `WHERE deleted_at IS NULL;`
    )

    this.addSql(`ALTER TABLE "packaging_types" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "packaging_types" FORCE ROW LEVEL SECURITY;`)
    this.addSql(`DROP POLICY IF EXISTS packaging_types_tenant_isolation ON "packaging_types";`)
    this.addSql(`
      CREATE POLICY packaging_types_tenant_isolation ON "packaging_types"
        USING (store_id = current_setting('app.tenant_id', true))
        WITH CHECK (store_id = current_setting('app.tenant_id', true));
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP POLICY IF EXISTS packaging_types_tenant_isolation ON "packaging_types";`)
    this.addSql(`ALTER TABLE "packaging_types" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "packaging_types" DISABLE ROW LEVEL SECURITY;`)
    this.addSql(`drop table if exists "packaging_types" cascade;`)
  }
}
