import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: Factory S002 T004 / ADR-003 — seo-module foundation tables for per-tenant SEO config and 301 redirects.
 * Changes:
 *   - New table: mercflow_seo_config (store_id, storefront_url, slug_strategy, org identity fields)
 *   - New table: mercflow_redirect (store_id, from_path, to_path, type)
 * Reversible: Yes — down() drops both tables
 * Fields derived from: .factory/planning/tasks.md T004, PRD-batch2 §3.1
 */
export class Migration20260604140000CreateMercflowSeoTables extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "mercflow_seo_config" (
        "id" text not null,
        "store_id" text not null,
        "storefront_url" text null,
        "slug_strategy" text not null default 'nordic',
        "org_name" text null,
        "org_logo_url" text null,
        "org_social_urls" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "mercflow_seo_config_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_seo_config_deleted_at" ON "mercflow_seo_config" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_seo_config_store_id" ON "mercflow_seo_config" ("store_id");`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mercflow_seo_config_store_unique" ON "mercflow_seo_config" ("store_id");`
    )

    this.addSql(`
      create table if not exists "mercflow_redirect" (
        "id" text not null,
        "store_id" text not null,
        "from_path" text not null,
        "to_path" text not null,
        "type" text not null default 'manual',
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "mercflow_redirect_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_redirect_deleted_at" ON "mercflow_redirect" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_redirect_store_id" ON "mercflow_redirect" ("store_id");`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mercflow_redirect_from_path_store_unique" ON "mercflow_redirect" ("from_path", "store_id");`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "mercflow_redirect" cascade;`)
    this.addSql(`drop table if exists "mercflow_seo_config" cascade;`)
  }
}
