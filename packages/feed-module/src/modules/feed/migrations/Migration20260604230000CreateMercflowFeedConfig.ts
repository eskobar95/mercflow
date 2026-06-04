import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: Factory T017 / ADR-003, ADR-004, ADR-005 — per-tenant Google Shopping feed configuration.
 * Changes:
 *   - New table: mercflow_feed_config (store_id NOT NULL, storefront_url, excluded_* jsonb, default_condition)
 *   - Unique index on store_id (soft-delete aware)
 *   - ENABLE + FORCE ROW LEVEL SECURITY + tenant_isolation policy
 * Reversible: Yes — down() drops RLS policy and table
 * Fields derived from: .factory/planning/tasks.md T017, PRD-batch2 §3.8
 */
const MERCFLOW_FEED_CONFIG_TABLE = "mercflow_feed_config"

export class Migration20260604230000CreateMercflowFeedConfig extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "${MERCFLOW_FEED_CONFIG_TABLE}" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"storefront_url" text null, ` +
        `"excluded_product_ids" jsonb not null default '[]', ` +
        `"excluded_category_ids" jsonb not null default '[]', ` +
        `"default_condition" text not null default 'new', ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "mercflow_feed_config_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_feed_config_deleted_at" ON "${MERCFLOW_FEED_CONFIG_TABLE}" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_feed_config_store_id" ON "${MERCFLOW_FEED_CONFIG_TABLE}" ("store_id");`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mercflow_feed_config_store_unique" ON "${MERCFLOW_FEED_CONFIG_TABLE}" ("store_id") WHERE deleted_at IS NULL;`
    )
    this.enableRlsOnTable(MERCFLOW_FEED_CONFIG_TABLE)
  }

  override async down(): Promise<void> {
    this.disableRlsOnTable(MERCFLOW_FEED_CONFIG_TABLE)
    this.addSql(`drop table if exists "${MERCFLOW_FEED_CONFIG_TABLE}" cascade;`)
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
