import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T039 — typed metafield values per entity instance (PRD-metafields J002, ADR-008 Option B).
 * Changes: metafield_values table with typed columns (value_text, value_json, value_number, value_boolean), locale default 'en';
 *   unique (store_id, definition_id, owner_id, locale); FK to metafield_definitions.
 * Reversible: Yes — down() drops table
 * Fields derived from: .factory/planning/tasks.md T039, ADR-008
 */
export class Migration20260610120200CreateMetafieldValues extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "metafield_values" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"definition_id" text not null, ` +
        `"owner_id" text not null, ` +
        `"owner_type" text not null, ` +
        `"value_text" text null, ` +
        `"value_json" jsonb null, ` +
        `"value_number" numeric null, ` +
        `"value_boolean" boolean null, ` +
        `"locale" text not null default 'en', ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "metafield_values_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_metafield_values_store_id" ON "metafield_values" ("store_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_metafield_values_definition_id" ON "metafield_values" ("definition_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_metafield_values_owner_id" ON "metafield_values" ("owner_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_metafield_values_deleted_at" ON "metafield_values" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_metafield_values_store_def_owner_locale" ` +
        `ON "metafield_values" ("store_id", "definition_id", "owner_id", "locale") ` +
        `WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `ALTER TABLE "metafield_values" ADD CONSTRAINT "metafield_values_definition_id_foreign" ` +
        `FOREIGN KEY ("definition_id") REFERENCES "metafield_definitions" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "metafield_values" cascade;`)
  }
}
