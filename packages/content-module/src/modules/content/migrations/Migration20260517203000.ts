import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: Notion task "Content module: DB schema + MikroORM models + migrations"
 *   (https://www.notion.so/3639946d4ef58129a669cffc76d1f22a) — CMS foundation tables
 *   additive to Medusa core; replaces earlier two-table content migration with full slice.
 * Changes:
 *   - New tables: product_content, category_content, article, page, page_version, page_block,
 *     cms_global, cms_redirect, media_asset, product_attribute, product_attr_link
 *   - Enum-like fields stored as text with CHECK constraints (draft/published, page types,
 *     attribute value types)
 *   - product_content / category_content: per-locale rows, body_json, varchar SEO limits,
 *     version, publish status
 * Reversible: Yes — down() drops all eleven tables (CASCADE on dependent FKs handled by order)
 * Generated via: Hand-authored to match DML in `src/modules/content/models/*.ts`
 *   (CLI `medusa db:generate` requires a live Postgres; refresh snapshots locally when available).
 *
 * Upgrade note: If legacy `product_content` / `category_content` from Migration20260424202438 exist,
 * they are dropped first so the new per-locale schema can be created (data loss for those two rows).
 */
export class Migration20260517203000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`drop table if exists "product_attr_link" cascade;`)
    this.addSql(`drop table if exists "product_attribute" cascade;`)
    this.addSql(`drop table if exists "media_asset" cascade;`)
    this.addSql(`drop table if exists "cms_redirect" cascade;`)
    this.addSql(`drop table if exists "cms_global" cascade;`)
    this.addSql(`drop table if exists "page_block" cascade;`)
    this.addSql(`drop table if exists "page_version" cascade;`)
    this.addSql(`drop table if exists "page" cascade;`)
    this.addSql(`drop table if exists "article" cascade;`)
    this.addSql(`drop table if exists "category_content" cascade;`)
    this.addSql(`drop table if exists "product_content" cascade;`)

    this.addSql(`
      create table if not exists "product_content" (
        "id" text not null,
        "product_id" text not null,
        "locale" text not null,
        "body_json" jsonb null,
        "seo_title" varchar(255) null,
        "seo_description" varchar(160) null,
        "og_image_url" text null,
        "status" text not null default 'draft',
        "version" integer not null default 1,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "product_content_pkey" primary key ("id"),
        constraint "product_content_status_check" check ("status" in ('draft', 'published'))
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_content_product_id" ON "product_content" ("product_id");`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_content_product_locale_unique" ON "product_content" ("product_id", "locale");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_content_deleted_at" ON "product_content" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`
      create table if not exists "category_content" (
        "id" text not null,
        "category_id" text not null,
        "locale" text not null,
        "body_json" jsonb null,
        "seo_title" varchar(255) null,
        "seo_description" varchar(160) null,
        "og_image_url" text null,
        "banner_image_url" text null,
        "status" text not null default 'draft',
        "version" integer not null default 1,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "category_content_pkey" primary key ("id"),
        constraint "category_content_status_check" check ("status" in ('draft', 'published'))
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_category_content_category_id" ON "category_content" ("category_id");`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_category_content_category_locale_unique" ON "category_content" ("category_id", "locale");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_category_content_deleted_at" ON "category_content" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`
      create table if not exists "article" (
        "id" text not null,
        "slug" text not null,
        "title" text not null,
        "body_json" jsonb null,
        "locale" text not null,
        "status" text not null default 'draft',
        "published_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "article_pkey" primary key ("id"),
        constraint "article_status_check" check ("status" in ('draft', 'published'))
      );
    `)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_article_slug_locale_unique" ON "article" ("slug", "locale");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_article_deleted_at" ON "article" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`
      create table if not exists "page" (
        "id" text not null,
        "slug" text not null,
        "title" text not null,
        "page_type" text not null,
        "status" text not null default 'draft',
        "locale" text not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "page_pkey" primary key ("id"),
        constraint "page_type_check" check ("page_type" in ('homepage', 'landing', 'content')),
        constraint "page_status_check" check ("status" in ('draft', 'published'))
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_page_deleted_at" ON "page" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`
      create table if not exists "page_version" (
        "id" text not null,
        "page_id" text not null,
        "version" integer not null,
        "status" text not null default 'draft',
        "published_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "page_version_pkey" primary key ("id"),
        constraint "page_version_status_check" check ("status" in ('draft', 'published')),
        constraint "page_version_page_id_fk" foreign key ("page_id") references "page" ("id")
          on update cascade on delete cascade
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_page_version_page_id" ON "page_version" ("page_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_page_version_deleted_at" ON "page_version" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`
      create table if not exists "page_block" (
        "id" text not null,
        "page_version_id" text not null,
        "sort_order" integer not null,
        "block_type" text not null,
        "data_json" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "page_block_pkey" primary key ("id"),
        constraint "page_block_page_version_id_fk" foreign key ("page_version_id") references "page_version" ("id")
          on update cascade on delete cascade
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_page_block_page_version_id" ON "page_block" ("page_version_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_page_block_deleted_at" ON "page_block" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`
      create table if not exists "cms_global" (
        "id" text not null,
        "scope" text not null,
        "data_json" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "cms_global_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cms_global_scope_unique" ON "cms_global" ("scope");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_cms_global_deleted_at" ON "cms_global" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`
      create table if not exists "cms_redirect" (
        "id" text not null,
        "from_path" text not null,
        "to_path" text not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "cms_redirect_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_cms_redirect_from_path" ON "cms_redirect" ("from_path");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_cms_redirect_deleted_at" ON "cms_redirect" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`
      create table if not exists "media_asset" (
        "id" text not null,
        "url" text not null,
        "alt" text null,
        "mime_type" text null,
        "width" integer null,
        "height" integer null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "media_asset_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_media_asset_deleted_at" ON "media_asset" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`
      create table if not exists "product_attribute" (
        "id" text not null,
        "handle" text not null,
        "label" text not null,
        "value_type" text not null default 'text',
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "product_attribute_pkey" primary key ("id"),
        constraint "product_attribute_value_type_check" check ("value_type" in ('text', 'number', 'boolean'))
      );
    `)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attribute_handle_unique" ON "product_attribute" ("handle");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_attribute_deleted_at" ON "product_attribute" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`
      create table if not exists "product_attr_link" (
        "id" text not null,
        "product_id" text not null,
        "attribute_id" text not null,
        "value_text" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "product_attr_link_pkey" primary key ("id"),
        constraint "product_attr_link_attribute_id_fk" foreign key ("attribute_id") references "product_attribute" ("id")
          on update cascade on delete cascade
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_attr_link_product_id" ON "product_attr_link" ("product_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_attr_link_attribute_id" ON "product_attr_link" ("attribute_id");`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attr_link_product_attribute_unique" ON "product_attr_link" ("product_id", "attribute_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_attr_link_deleted_at" ON "product_attr_link" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_attr_link" cascade;`)
    this.addSql(`drop table if exists "product_attribute" cascade;`)
    this.addSql(`drop table if exists "media_asset" cascade;`)
    this.addSql(`drop table if exists "cms_redirect" cascade;`)
    this.addSql(`drop table if exists "cms_global" cascade;`)
    this.addSql(`drop table if exists "page_block" cascade;`)
    this.addSql(`drop table if exists "page_version" cascade;`)
    this.addSql(`drop table if exists "page" cascade;`)
    this.addSql(`drop table if exists "article" cascade;`)
    this.addSql(`drop table if exists "category_content" cascade;`)
    this.addSql(`drop table if exists "product_content" cascade;`)
  }
}
