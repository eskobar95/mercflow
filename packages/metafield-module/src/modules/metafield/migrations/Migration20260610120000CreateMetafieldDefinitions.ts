import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T038 prerequisite for T039 — metafield definition catalog per store (PRD-metafields M008, ADR-008).
 * Changes: metafield_definitions table with store_id, owner_type, namespace, key, type metadata;
 *   unique (store_id, owner_type, namespace, key); RLS with library read + tenant write policies.
 * Reversible: Yes — down() drops policies and table
 * Fields derived from: .factory/planning/tasks.md T038, ADR-008
 */
export class Migration20260610120000CreateMetafieldDefinitions extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "metafield_definitions" (` +
        `"id" text not null, ` +
        `"store_id" text null, ` +
        `"owner_type" text not null, ` +
        `"namespace" text not null, ` +
        `"key" text not null, ` +
        `"name" text not null, ` +
        `"description" text null, ` +
        `"type" text not null, ` +
        `"validations" jsonb null, ` +
        `"pinned_position" integer null, ` +
        `"is_required" boolean not null default false, ` +
        `"is_primary" boolean not null default false, ` +
        `"category_constraint_id" text null, ` +
        `"is_standard" boolean not null default false, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "metafield_definitions_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_metafield_definitions_store_id" ON "metafield_definitions" ("store_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_metafield_definitions_deleted_at" ON "metafield_definitions" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_metafield_definitions_store_owner_ns_key" ` +
        `ON "metafield_definitions" ("store_id", "owner_type", "namespace", "key") ` +
        `WHERE deleted_at IS NULL;`
    )

    this.addSql(`ALTER TABLE "metafield_definitions" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "metafield_definitions" FORCE ROW LEVEL SECURITY;`)
    this.addSql(`DROP POLICY IF EXISTS metafield_definitions_select ON "metafield_definitions";`)
    this.addSql(`
      CREATE POLICY metafield_definitions_select ON "metafield_definitions"
        FOR SELECT
        USING (
          store_id IS NULL
          OR store_id = current_setting('app.tenant_id', true)
        );
    `)
    this.addSql(`DROP POLICY IF EXISTS metafield_definitions_insert ON "metafield_definitions";`)
    this.addSql(`
      CREATE POLICY metafield_definitions_insert ON "metafield_definitions"
        FOR INSERT
        WITH CHECK (store_id = current_setting('app.tenant_id', true));
    `)
    this.addSql(`DROP POLICY IF EXISTS metafield_definitions_update ON "metafield_definitions";`)
    this.addSql(`
      CREATE POLICY metafield_definitions_update ON "metafield_definitions"
        FOR UPDATE
        USING (store_id = current_setting('app.tenant_id', true))
        WITH CHECK (store_id = current_setting('app.tenant_id', true));
    `)
    this.addSql(`DROP POLICY IF EXISTS metafield_definitions_delete ON "metafield_definitions";`)
    this.addSql(`
      CREATE POLICY metafield_definitions_delete ON "metafield_definitions"
        FOR DELETE
        USING (store_id = current_setting('app.tenant_id', true));
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP POLICY IF EXISTS metafield_definitions_delete ON "metafield_definitions";`)
    this.addSql(`DROP POLICY IF EXISTS metafield_definitions_update ON "metafield_definitions";`)
    this.addSql(`DROP POLICY IF EXISTS metafield_definitions_insert ON "metafield_definitions";`)
    this.addSql(`DROP POLICY IF EXISTS metafield_definitions_select ON "metafield_definitions";`)
    this.addSql(`ALTER TABLE "metafield_definitions" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "metafield_definitions" DISABLE ROW LEVEL SECURITY;`)
    this.addSql(`drop table if exists "metafield_definitions" cascade;`)
  }
}
