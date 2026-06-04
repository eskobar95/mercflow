import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: Factory T002 / ADR-005 — defence-in-depth tenant isolation via PostgreSQL RLS on all
 *   tables that received store_id in T001 (MercFlow content-module + Guapo-custom medusa tables).
 * Changes:
 *   - ENABLE + FORCE ROW LEVEL SECURITY on each table in TENANCY_TABLES
 *   - CREATE POLICY tenant_isolation USING (store_id = current_setting('app.store_id', true))
 * Reversible: Yes — down() drops policies and disables RLS on each table
 * Fields derived from: .factory/planning/tasks.md T002, ADR-005
 */
const MERCFLOW_CONTENT_TABLES = [
  "product_content",
  "category_content",
  "article",
  "page",
  "page_version",
  "page_block",
  "cms_global",
  "cms_redirect",
  "media_asset",
  "product_attribute",
  "product_attr_link",
] as const

const GUAPO_CUSTOM_TABLES = [
  "brand",
  "product_product_brand_brand",
  "product_review",
  "product_review_image",
  "product_review_response",
  "product_review_stats",
  "guapo_free_shipping_setting",
] as const

const TENANCY_TABLES = [...MERCFLOW_CONTENT_TABLES, ...GUAPO_CUSTOM_TABLES] as const

export class Migration20260604220000EnableRlsTenantIsolation extends Migration {
  override async up(): Promise<void> {
    for (const table of MERCFLOW_CONTENT_TABLES) {
      this.enableRlsOnTable(table)
    }
    for (const table of GUAPO_CUSTOM_TABLES) {
      this.enableRlsOnOptionalTable(table)
    }
  }

  override async down(): Promise<void> {
    for (const table of [...GUAPO_CUSTOM_TABLES].reverse()) {
      this.disableRlsOnOptionalTable(table)
    }
    for (const table of [...MERCFLOW_CONTENT_TABLES].reverse()) {
      this.disableRlsOnTable(table)
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

  private enableRlsOnOptionalTable(table: string): void {
    this.addSql(`
      DO $migration$
      BEGIN
        IF to_regclass('public."${table}"') IS NOT NULL THEN
          ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;
          ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS tenant_isolation ON "${table}";
          CREATE POLICY tenant_isolation ON "${table}"
            USING (store_id = current_setting('app.store_id', true));
        END IF;
      END
      $migration$;
    `)
  }

  private disableRlsOnOptionalTable(table: string): void {
    this.addSql(`
      DO $migration$
      BEGIN
        IF to_regclass('public."${table}"') IS NOT NULL THEN
          DROP POLICY IF EXISTS tenant_isolation ON "${table}";
          ALTER TABLE "${table}" NO FORCE ROW LEVEL SECURITY;
          ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;
        END IF;
      END
      $migration$;
    `)
  }
}

export { TENANCY_TABLES }
