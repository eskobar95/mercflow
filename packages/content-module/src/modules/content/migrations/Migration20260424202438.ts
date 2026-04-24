import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: Initial content module schema for Task 6.1 — product and category content tables.
 * Changes:
 *   - New table: product_content (DML: ProductContent)
 *   - New table: category_content (DML: CategoryContent)
 *   - Fields per `.cursor/rules/content-module.mdc`; timestamps via Medusa DML
 * Reversible: Yes — down() drops both tables
 * Generated via: pnpm exec medusa db:generate content (from `packages/content-module` with Medusa 2.14.1)
 */
export class Migration20260424202438 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "category_content" ("id" text not null, "category_id" text not null, "description_rich" jsonb null, "seo_title" text null, "seo_description" text null, "seo_og_image_id" text null, "banner_image_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "category_content_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_category_content_deleted_at" ON "category_content" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_content" ("id" text not null, "product_id" text not null, "description_rich" jsonb null, "seo_title" text null, "seo_description" text null, "seo_og_image_id" text null, "media_gallery" text[] null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_content_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_content_deleted_at" ON "product_content" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "category_content" cascade;`);

    this.addSql(`drop table if exists "product_content" cascade;`);
  }

}
