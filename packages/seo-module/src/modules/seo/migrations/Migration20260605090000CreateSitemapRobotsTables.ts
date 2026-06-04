import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: Factory S003 T009/T011 — per-tenant sitemap and robots.txt configuration (ADR-003, ADR-004, ADR-005).
 * Changes:
 *   - New table: mercflow_sitemap_config (store_id, page_type_settings, exclusion lists)
 *   - New table: mercflow_robots_config (store_id, structured_rules, freetext_override, change_history)
 *   - Index on mercflow_seo_config.storefront_url for Host→store_id lookup (T008 option A)
 * Reversible: Yes — down() drops new tables and index
 * Fields derived from: .factory/planning/tasks.md T009, T011, T008
 */
export class Migration20260605090000CreateSitemapRobotsTables extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "mercflow_sitemap_config" (
        "id" text not null,
        "store_id" text not null,
        "page_type_settings" jsonb null,
        "excluded_product_ids" jsonb null,
        "excluded_category_ids" jsonb null,
        "excluded_page_ids" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "mercflow_sitemap_config_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_sitemap_config_deleted_at" ON "mercflow_sitemap_config" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_sitemap_config_store_id" ON "mercflow_sitemap_config" ("store_id");`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mercflow_sitemap_config_store_unique" ON "mercflow_sitemap_config" ("store_id");`
    )

    this.addSql(`
      create table if not exists "mercflow_robots_config" (
        "id" text not null,
        "store_id" text not null,
        "structured_rules" jsonb null,
        "freetext_override" text null,
        "change_history" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "mercflow_robots_config_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_robots_config_deleted_at" ON "mercflow_robots_config" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_robots_config_store_id" ON "mercflow_robots_config" ("store_id");`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mercflow_robots_config_store_unique" ON "mercflow_robots_config" ("store_id");`
    )

    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_seo_config_storefront_url" ON "mercflow_seo_config" ("storefront_url") WHERE storefront_url IS NOT NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_mercflow_seo_config_storefront_url";`)
    this.addSql(`drop table if exists "mercflow_robots_config" cascade;`)
    this.addSql(`drop table if exists "mercflow_sitemap_config" cascade;`)
  }
}
